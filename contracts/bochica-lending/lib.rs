#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod bochica_lending {
    use ink::storage::Mapping;

    // Project status enum
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub enum ProjectStatus {
        Active,
        Funded,
        Borrowed,
        Repaid,
    }

    // Project struct
    #[derive(Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Project {
        pub creator: AccountId,
        pub goal_amount: Balance,
        pub current_funding: Balance,
        pub interest_rate: u8,
        pub status: ProjectStatus,
    }

    // Investment struct
    #[derive(Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Investment {
        pub investor: AccountId,
        pub amount: Balance,
        pub lockup_end: Timestamp,
        pub claimed: bool,
    }

    // Loan struct
    #[derive(Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Loan {
        pub amount: Balance,
        pub interest_rate: u8,
        pub total_repayment: Balance,
        pub due_date: Timestamp,
        pub repaid: bool,
    }

    // Main contract storage
    #[ink(storage)]
    pub struct BochicaLending {
        // Platform wallet for fees
        platform_wallet: AccountId,

        // Platform fee percentage (2 = 2%)
        platform_fee: u8,

        // Projects: project_id => Project
        projects: Mapping<u32, Project>,

        // Investments: (project_id, investor) => Investment
        investments: Mapping<(u32, AccountId), Investment>,

        // Loans: project_id => Loan
        loans: Mapping<u32, Loan>,

        // Project counter
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

    // Error types
    #[derive(Debug, Clone, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
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

    // Contract implementation
    impl BochicaLending {
        /// Constructor
        #[ink(constructor)]
        pub fn new(platform_wallet: AccountId) -> Self {
            Self {
                platform_wallet,
                platform_fee: 2, // 2%
                projects: Mapping::default(),
                investments: Mapping::default(),
                loans: Mapping::default(),
                next_project_id: 1,
            }
        }

        /// Create a new project
        #[ink(message)]
        pub fn create_project(
            &mut self,
            goal_amount: Balance,
            interest_rate: u8,
        ) -> u32 {
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

        /// DEPOSIT FUNCTION - Investor deposits USDT
        #[ink(message, payable)]
        pub fn deposit(
            &mut self,
            project_id: u32,
            lockup_period: Timestamp,
        ) -> Result<(), Error> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            // Validate amount
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            // Get project
            let mut project = self.projects.get(project_id)
                .ok_or(Error::ProjectNotFound)?;

            // Check project is active
            if project.status != ProjectStatus::Active {
                return Err(Error::ProjectNotActive);
            }

            // Calculate platform fee (2%)
            let fee = (amount * self.platform_fee as u128) / 100;
            let net_amount = amount - fee;

            // Transfer fee to platform wallet
            if fee > 0 {
                self.env().transfer(self.platform_wallet, fee)
                    .map_err(|_| Error::TransferFailed)?;
            }

            // Update project funding
            project.current_funding += net_amount;

            // Check if project is now fully funded
            if project.current_funding >= project.goal_amount {
                project.status = ProjectStatus::Funded;
            }

            self.projects.insert(project_id, &project);

            // Record investment
            let lockup_end = self.env().block_timestamp() + lockup_period;
            let investment = Investment {
                investor: caller,
                amount: net_amount,
                lockup_end,
                claimed: false,
            };

            self.investments.insert((project_id, caller), &investment);

            // Emit event
            self.env().emit_event(Deposited {
                project_id,
                investor: caller,
                amount,
                net_amount,
            });

            Ok(())
        }

        /// WITHDRAW FUNCTION - Creator withdraws funds when 100% funded
        #[ink(message)]
        pub fn withdraw(&mut self, project_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();

            // Get project
            let mut project = self.projects.get(project_id)
                .ok_or(Error::ProjectNotFound)?;

            // Verify caller is project creator
            if caller != project.creator {
                return Err(Error::Unauthorized);
            }

            // Verify project is fully funded
            if project.status != ProjectStatus::Funded {
                return Err(Error::ProjectNotFunded);
            }

            // Calculate total repayment with interest
            let interest_amount = (project.current_funding * project.interest_rate as u128) / 100;
            let total_repayment = project.current_funding + interest_amount;

            // Calculate loan due date (30 days from now)
            let due_date = self.env().block_timestamp() + (30 * 24 * 60 * 60 * 1000);

            // Create loan record
            let loan = Loan {
                amount: project.current_funding,
                interest_rate: project.interest_rate,
                total_repayment,
                due_date,
                repaid: false,
            };

            self.loans.insert(project_id, &loan);

            // Transfer funds to creator
            let amount = project.current_funding;
            self.env().transfer(caller, amount)
                .map_err(|_| Error::TransferFailed)?;

            // Update project status
            project.status = ProjectStatus::Borrowed;
            self.projects.insert(project_id, &project);

            // Emit event
            self.env().emit_event(Withdrawn {
                project_id,
                creator: caller,
                amount,
            });

            Ok(())
        }

        /// REPAY FUNCTION - Creator repays loan with interest
        #[ink(message, payable)]
        pub fn repay(&mut self, project_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            // Get project
            let mut project = self.projects.get(project_id)
                .ok_or(Error::ProjectNotFound)?;

            // Verify caller is project creator
            if caller != project.creator {
                return Err(Error::Unauthorized);
            }

            // Get loan
            let mut loan = self.loans.get(project_id)
                .ok_or(Error::LoanNotFound)?;

            // Verify loan not already repaid
            if loan.repaid {
                return Err(Error::AlreadyRepaid);
            }

            // Verify amount is sufficient (must cover total repayment)
            if amount < loan.total_repayment {
                return Err(Error::InsufficientRepayment);
            }

            // Mark loan as repaid
            loan.repaid = true;
            self.loans.insert(project_id, &loan);

            // Update project status
            project.status = ProjectStatus::Repaid;
            self.projects.insert(project_id, &project);

            // Emit event
            self.env().emit_event(Repaid {
                project_id,
                amount,
            });

            Ok(())
        }

        /// CLAIM FUNCTION - Investor claims capital + interest after repayment
        #[ink(message)]
        pub fn claim(&mut self, project_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();

            // Get investment
            let mut investment = self.investments.get((project_id, caller))
                .ok_or(Error::InvestmentNotFound)?;

            // Verify not already claimed
            if investment.claimed {
                return Err(Error::AlreadyClaimed);
            }

            // Get loan
            let loan = self.loans.get(project_id)
                .ok_or(Error::LoanNotFound)?;

            // Verify loan is repaid
            if !loan.repaid {
                return Err(Error::LoanNotRepaid);
            }

            // Verify lockup period expired
            let current_time = self.env().block_timestamp();
            if current_time < investment.lockup_end {
                return Err(Error::LockupNotExpired);
            }

            // Get project to calculate proportional share
            let project = self.projects.get(project_id)
                .ok_or(Error::ProjectNotFound)?;

            // Calculate investor's share of repayment
            // share = (investor_amount / total_funding) * total_repayment
            let investor_share = (investment.amount * loan.total_repayment) / project.current_funding;

            // Mark as claimed
            investment.claimed = true;
            self.investments.insert((project_id, caller), &investment);

            // Transfer share to investor
            self.env().transfer(caller, investor_share)
                .map_err(|_| Error::TransferFailed)?;

            // Emit event
            self.env().emit_event(Claimed {
                project_id,
                investor: caller,
                amount: investor_share,
            });

            Ok(())
        }

        /// Get platform wallet address
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
