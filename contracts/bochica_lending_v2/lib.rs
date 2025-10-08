#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![allow(clippy::arithmetic_side_effects)]

#[ink::contract]
mod bochica_lending_v2 {
    use ink::storage::Mapping;

    // Project status enum
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum ProjectStatus {
        Active,
        Funded,
        Borrowed,
        Repaid,
    }

    // Project struct
    #[derive(Clone, Copy)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Project {
        pub creator: AccountId,
        pub goal_amount: Balance,
        pub current_funding: Balance,
        pub interest_rate: u8,
        pub status: ProjectStatus,
    }

    // Investment struct
    #[derive(Clone, Copy)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Investment {
        pub investor: AccountId,
        pub amount: Balance,
        pub lockup_end: Timestamp,
        pub claimed: bool,
    }

    // Loan struct
    #[derive(Clone, Copy)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Loan {
        pub amount: Balance,
        pub interest_rate: u8,
        pub total_repayment: Balance,
        pub due_date: Timestamp,
        pub repaid: bool,
    }

    // Error types
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        ZeroAmount,
        ProjectNotFound,
        ProjectNotActive,
        TransferFailed,
        Unauthorized,
        ProjectNotFunded,
        LoanNotFound,
        LoanNotRepaid,
        LockupNotExpired,
        AlreadyClaimed,
        AlreadyRepaid,
        InsufficientRepayment,
        InvestmentNotFound,
    }

    // Main contract storage
    #[ink(storage)]
    pub struct BochicaLendingV2 {
        platform_wallet: AccountId,
        platform_fee: u8,
        projects: Mapping<u32, Project>,
        investments: Mapping<(u32, AccountId), Investment>,
        loans: Mapping<u32, Loan>,
        next_project_id: u32,
    }

    // Events
    #[ink(event)]
    pub struct Deposited {
        #[ink(topic)]
        project_id: u32,
        #[ink(topic)]
        investor: AccountId,
        amount: Balance,
        net_amount: Balance,
    }

    #[ink(event)]
    pub struct Withdrawn {
        #[ink(topic)]
        project_id: u32,
        #[ink(topic)]
        creator: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct Repaid {
        #[ink(topic)]
        project_id: u32,
        amount: Balance,
    }

    #[ink(event)]
    pub struct Claimed {
        #[ink(topic)]
        project_id: u32,
        #[ink(topic)]
        investor: AccountId,
        amount: Balance,
    }

    impl BochicaLendingV2 {
        /// Constructor
        #[ink(constructor)]
        pub fn new(platform_wallet: AccountId) -> Self {
            Self {
                platform_wallet,
                platform_fee: 2,
                projects: Mapping::default(),
                investments: Mapping::default(),
                loans: Mapping::default(),
                next_project_id: 1,
            }
        }

        /// Create a new project
        #[ink(message)]
        pub fn create_project(&mut self, goal_amount: Balance, interest_rate: u8) -> u32 {
            let project_id = self.next_project_id;
            let caller = self.env().caller();

            let project = Project {
                creator: caller,
                goal_amount,
                current_funding: 0,
                interest_rate,
                status: ProjectStatus::Active,
            };

            self.projects.insert(project_id, &project);
            self.next_project_id += 1;

            project_id
        }

        /// DEPOSIT - Investor deposits funds
        #[ink(message, payable)]
        pub fn deposit(&mut self, project_id: u32, lockup_period: Timestamp) -> Result<(), Error> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            let mut project = self.projects.get(project_id).ok_or(Error::ProjectNotFound)?;

            if project.status != ProjectStatus::Active {
                return Err(Error::ProjectNotActive);
            }

            let fee = (amount * self.platform_fee as u128) / 100;
            let net_amount = amount - fee;

            if fee > 0 {
                self.env()
                    .transfer(self.platform_wallet, fee)
                    .map_err(|_| Error::TransferFailed)?;
            }

            project.current_funding += net_amount;

            if project.current_funding >= project.goal_amount {
                project.status = ProjectStatus::Funded;
            }

            self.projects.insert(project_id, &project);

            let lockup_end = self.env().block_timestamp() + lockup_period;
            let investment = Investment {
                investor: caller,
                amount: net_amount,
                lockup_end,
                claimed: false,
            };

            self.investments.insert((project_id, caller), &investment);

            self.env().emit_event(Deposited {
                project_id,
                investor: caller,
                amount,
                net_amount,
            });

            Ok(())
        }

        /// WITHDRAW - Creator withdraws when 100% funded
        #[ink(message)]
        pub fn withdraw(&mut self, project_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut project = self.projects.get(project_id).ok_or(Error::ProjectNotFound)?;

            if caller != project.creator {
                return Err(Error::Unauthorized);
            }

            if project.status != ProjectStatus::Funded {
                return Err(Error::ProjectNotFunded);
            }

            let interest_amount = (project.current_funding * project.interest_rate as u128) / 100;
            let total_repayment = project.current_funding + interest_amount;
            let due_date = self.env().block_timestamp() + (30 * 24 * 60 * 60 * 1000);

            let loan = Loan {
                amount: project.current_funding,
                interest_rate: project.interest_rate,
                total_repayment,
                due_date,
                repaid: false,
            };

            self.loans.insert(project_id, &loan);

            let amount = project.current_funding;
            self.env()
                .transfer(caller, amount)
                .map_err(|_| Error::TransferFailed)?;

            project.status = ProjectStatus::Borrowed;
            self.projects.insert(project_id, &project);

            self.env().emit_event(Withdrawn {
                project_id,
                creator: caller,
                amount,
            });

            Ok(())
        }

        /// REPAY - Creator repays loan with interest
        #[ink(message, payable)]
        pub fn repay(&mut self, project_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            let mut project = self.projects.get(project_id).ok_or(Error::ProjectNotFound)?;

            if caller != project.creator {
                return Err(Error::Unauthorized);
            }

            let mut loan = self.loans.get(project_id).ok_or(Error::LoanNotFound)?;

            if loan.repaid {
                return Err(Error::AlreadyRepaid);
            }

            if amount < loan.total_repayment {
                return Err(Error::InsufficientRepayment);
            }

            loan.repaid = true;
            self.loans.insert(project_id, &loan);

            project.status = ProjectStatus::Repaid;
            self.projects.insert(project_id, &project);

            self.env().emit_event(Repaid { project_id, amount });

            Ok(())
        }

        /// CLAIM - Investor claims capital + interest
        #[ink(message)]
        pub fn claim(&mut self, project_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();

            let mut investment = self
                .investments
                .get((project_id, caller))
                .ok_or(Error::InvestmentNotFound)?;

            if investment.claimed {
                return Err(Error::AlreadyClaimed);
            }

            let loan = self.loans.get(project_id).ok_or(Error::LoanNotFound)?;

            if !loan.repaid {
                return Err(Error::LoanNotRepaid);
            }

            let current_time = self.env().block_timestamp();
            if current_time < investment.lockup_end {
                return Err(Error::LockupNotExpired);
            }

            let project = self.projects.get(project_id).ok_or(Error::ProjectNotFound)?;

            let investor_share = (investment.amount * loan.total_repayment) / project.current_funding;

            investment.claimed = true;
            self.investments.insert((project_id, caller), &investment);

            self.env()
                .transfer(caller, investor_share)
                .map_err(|_| Error::TransferFailed)?;

            self.env().emit_event(Claimed {
                project_id,
                investor: caller,
                amount: investor_share,
            });

            Ok(())
        }

        /// Get platform wallet
        #[ink(message)]
        pub fn get_platform_wallet(&self) -> AccountId {
            self.platform_wallet
        }

        /// Get project details
        #[ink(message)]
        pub fn get_project(&self, project_id: u32) -> Option<Project> {
            self.projects.get(project_id)
        }

        /// Get investment details
        #[ink(message)]
        pub fn get_investment(&self, project_id: u32, investor: AccountId) -> Option<Investment> {
            self.investments.get((project_id, investor))
        }

        /// Get loan details
        #[ink(message)]
        pub fn get_loan(&self, project_id: u32) -> Option<Loan> {
            self.loans.get(project_id)
        }
    }
}
