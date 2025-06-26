# AWS Migration App

The AWS Migration App is a full-stack application designed to streamline the migration of AWS accounts between environments (e.g., from one AWS Organization or payer account to another). It provides a guided, automated, and auditable process for cloud administrators and engineers, reducing manual effort, minimizing errors, and ensuring compliance.

*Last Updated: June 26, 2025*

## Table of Contents
- [Project Overview](#project-overview)
- [Challenges Addressed](#challenges-addressed)
- [Key Features](#key-features)
- [Migration Phases](#migration-phases)
- [API Endpoints](#api-endpoints)
- [Code Flow](#code-flow)
- [Python Script Integration](#python-script-integration)
- [Setup Instructions](#setup-instructions)
- [References](#references)
- [Contributing](#contributing)
- [Contact](#contact)

## Project Overview
The AWS Migration App assists organizations in migrating AWS accounts by automating critical steps, providing clear guidance, and maintaining a comprehensive audit trail. It is built for:

- **Cloud Administrators and Engineers**: Managing AWS account migrations.
- **Organizations**: Undergoing restructuring, mergers, or compliance-driven reorganizations.
- **Teams**: Seeking to automate, standardize, and document the migration process.

The app transforms a traditionally manual, error-prone process into a streamlined workflow that can be completed in approximately 30 minutes, compared to weeks of manual effort.

## Challenges Addressed
Migrating AWS accounts is complex due to:
- **Multiple AWS Services**: Involves IAM, S3, KMS, CloudFormation, and more, each with dependencies.
- **Security and Compliance**: Requires thorough checks for regulatory compliance.
- **Dependencies**: Resources, data, and policies have interdependencies that must be managed.
- **Downtime Risks**: Misconfigurations can cause outages.
- **Manual Effort**: Without automation, migrations involve tedious, error-prone tasks.

The app addresses these by automating 80% of the process, providing clear instructions for the remaining 20% (due to AWS attach/detach policy restrictions), and centralizing status and logs.

## Key Features
- **Step-by-Step Guidance**: Breaks migration into six phases with automated or guided steps.
- **Automated Checks**: Performs tasks like scanning RAM resources, checking delegated admins, verifying cost data, and more.
- **Centralized Dashboard**: Displays account status, migration progress, and logs.
- **Audit Trail**: Logs every step with results and timestamps for compliance.
- **Error Handling**: Identifies issues and supports recovery (e.g., creating fallback IAM admin users).

## Migration Phases
The app organizes the migration process into six phases:
1. **Assess Existing**:
   - Inventories resources, policies, and configurations.
   - Identifies dependencies and blockers (e.g., RAM shares, policy references).
2. **Prepare New**:
   - Sets up the target AWS Organization or payer account.
   - Configures permissions and baseline settings.
3. **Migrate**:
   - Moves resources, data, and configurations using automated or manual steps.
4. **Verify**:
   - Validates functionality in the new environment with post-migration checks.
5. **Post-Migration**:
   - Cleans up old resources and ensures compliance.
6. **Custom/Organization-Specific**:
   - Supports additional requirements (e.g., custom compliance checks).

### AWS Attach/Detach Policy Challenge
AWS’s attach/detach policy governs how accounts and resources are moved between Organizations, often requiring manual approvals or waiting periods. The app automates 80% of steps, provides instructions for the remaining 20%, and tracks manual completions, reducing the traditional 37-step, two-week process to ~30 minutes.

## API Endpoints
The backend (`server/Backend/app/api/routes/steps.py`) exposes API endpoints for migration steps under phase-specific base paths (e.g., `/assess-existing/`).

### Assess Existing Phase
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/assess-existing/check_ram` | GET | Checks AWS RAM shared resources | `account_id` (query, required) |
| `/assess-existing/check_admin_services` | GET | Checks delegated admin services (GuardDuty, Backup, Inspector) | `account_id` (query, required) |
| `/assess-existing/cost_explorer_data` | GET | Verifies Cost Explorer data and CUR reports | `account_id` (query, required) |
| `/assess-existing/check_savings` | GET | Checks Reserved Instances and Savings Plans | `account_id` (query, required) |
| `/assess-existing/check_policies` | GET | Scans policies for Organization/OU references | `account_id` (query, required) |
| `/assess-existing/check_stacksets` | GET | Checks CloudFormation StackSets for Organization integration | `account_id` (query, required) |
| `/assess-existing/create_iam_admin` | GET | Creates fallback IAM admin user for SSO failure | `account_id` (query, required) |

### Execution History and Status
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/{phase_type}/{step_slug}/latest` | GET | Gets latest execution result | `phase_type` (e.g., `assess-existing`), `step_slug` (e.g., `check_ram`), `account_id` (query, required) |
| `/{phase_type}/{step_slug}/history` | GET | Gets execution history | `phase_type`, `step_slug`, `account_id` (query, required) |

### Step IDs and Phase Mapping
- **Step IDs**:
  - `check_ram`: 1
  - `check_admin_services`: 2
  - `cost_explorer_data`: 3
  - `check_savings`: 4
  - `check_policies`: 5
  - `check_stacksets`: 6
  - `create_iam_admin`: 8
- **Phase Mapping**:
  - `assess-existing`: Steps [1, 2, 3, 4, 5, 6, 8]
  - `prepare-new`, `migrate`, `verify`, `post-migration`: Currently empty

### Example Usage
```bash
# Check RAM resources
GET http://localhost:8000/assess-existing/check_ram?account_id=<account_id>

# Get latest execution for check_ram
GET http://localhost:8000/assess-existing/check_ram/latest?account_id=<account_id>
```

## Code Flow

### Backend
- **Initialization** (`main.py`): Initializes FastAPI, loads configurations (`app/core/config.py`), and includes routes.
- **API Routes** (`app/api/routes/steps.py`): Validate inputs, call AWS functions from `app/services/aws_services.py`, save results to the `aws_migration` database via `app/db/PG_queries.py`, and return structured responses.
- **AWS Logic** (`app/services/aws_services.py`): Uses boto3 for AWS operations (e.g., listing RAM resources), handling errors and formatting results.
- **Database** (`app/db/`): Manages PostgreSQL connections (`PG.py`), sessions (`session.py`), schemas (`schemas.py`), and migrations (`migrations.py`).
- **Data Flow**: Frontend request → Route validates → AWS service executes → Database saves → Response to frontend.

### Frontend
- **Initialization** (`src/main.tsx`): Renders `App.tsx`, which sets up routing and context providers (`ThemeContext`, `AccountContext`, etc.).
- **Routing** (`src/App.tsx`): Maps `src/pages/` (e.g., `Dashboard.tsx`, `MigrationJourney.tsx`) to routes via React Router.
- **State Management**:
  - Global: Contexts in `src/context/` with custom hooks (e.g., `useAccount`).
  - Local: `useState`/`useReducer` in components/pages.
- **API Calls** (`src/services/`): Use Axios to call backend endpoints (e.g., `migrationApi.ts`).
- **Components** (`src/components/`): Reusable UI (`ui/`) and feature-specific components (`migration/`, `agent/`).
- **Data Flow**: User action → Service call → Backend response → Render in components (e.g., `StepCard.tsx`).

## Python Script Integration
The `server/Backend/pythonscripts` folder contains scripts for automating migration steps. These can be integrated as API endpoints.

### Step-to-Script Mapping
| Migration Step | Step Slug | Script File |
|----------------|-----------|-------------|
| Create KMS key | `create-kms` | `create_kms.py` |
| Deploy Control Tower | `deploy-control-tower` | `deploy_control_tower.py` |
| Raise AWS Organizations service limits | `raise-limits` | `raise_limits.py` |
| Configure SSO with external IdP | `configure-sso` | `configure_sso.py` |
| Create new OUs | `create-ous` | `create_ous.py` |
| Replicate SSO Configs | `replicate-sso` | `replicate_sso.py` |
| Remove CloudTrail account trail | `remove-cloudtrail` | `remove_cloudtrail.py` |
| Move non-Prod accounts | `move-nonprod` | `move_nonprod.py` |
| Move accounts to new OUs | `move-accounts` | `move_accounts.py` |
| Register OU in Control Tower | `register-ou` | `register_ou.py` |
| Remove SecOps CloudTrail | `remove-secops` | `remove_secops.py` |
| Duplicate SSO config and test | `test-sso` | `test_sso.py` |
| Migrate smaller accounts | `migrate-small` | `migrate_small.py` |
| Migrate larger accounts | `migrate-large` | `migrate_large.py` |
| Migrate old payer account | `migrate-payer` | `migrate_payer.py` |
| Move Production accounts | `migrate-prod` | `migrate_prod.py` |
| Delete CUR report in S3 | `delete-cur` | `delete_cur.py` |
| Import accounts into Control Tower | `import-accounts` | `import_accounts.py` |

### Integration Steps
1. **Locate Script**: Find the script in `pythonscripts` (e.g., `create_kms.py`).
2. **Move Logic**: Add the script’s logic to a function in `app/services/aws_services.py`:
   ```python
   def create_kms_key(db: Session = None, account_id: str = None):
       session = get_aws_session(account_id)
       kms_client = session.client('kms')
       response = kms_client.create_key(Description='Migration KMS Key')
       return {"success": True, "data": response}
   ```
3. **Add API Route** (`app/api/routes/steps.py`):
   ```python
   from app.services.aws_services import create_kms_key

   @router.get("/prepare-new/create-kms", response_model=StepResponse)
   async def create_kms(account_id: str = Query(None), db: Session = Depends(get_db)):
       step_id = 101
       result = create_kms_key(db, account_id)
       execution = save_execution(db, step_id, account_id, result)
       return {"step_id": step_id, "status": result["success"], "result": result["data"], "logs": [], "execution_time": execution.execution_time}
   ```
4. **Update Mappings**: Add to `STEP_IDS` (`create-kms: 101`) and `PHASE_STEPS` (`prepare-new: [101]`).
5. **Update Frontend**: Add a button/action to call `/prepare-new/create-kms` and display results.

## Setup Instructions

### Prerequisites
- **Node.js** (v16+): [nodejs.org](https://nodejs.org/)
- **Python** (3.9+): [python.org](https://www.python.org/)
- **PostgreSQL** (13+) and **pgAdmin**: [postgresql.org](https://www.postgresql.org/), [pgadmin.org](https://www.pgadmin.org/)
- **Git**: [git-scm.com](https://git-scm.com/)
- **AWS Credentials**: From AWS IAM console.

### Backend Setup
1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd server/Backend
   ```
2. **Virtual Environment**:
   ```bash
   python -m venv venv
   # Windows: venv\Scripts\activate
   # Mac/Linux: source venv/bin/activate
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Set Up PostgreSQL**:
   - In pgAdmin, create database `aws_migration` and user `migrationuser` with password `yourpassword`.
   - Grant privileges:
     ```sql
     GRANT ALL PRIVILEGES ON DATABASE aws_migration TO migrationuser;
     ```
5. **Configure Environment**:
   - Create `server/Backend/.env`:
     ```env
     DATABASE_URL=postgresql://migrationuser:yourpassword@localhost:5432/aws_migration
     AWS_ACCESS_KEY_ID=your_aws_access_key
     AWS_SECRET_ACCESS_KEY=your_aws_secret_key
     AWS_DEFAULT_REGION=us-east-1
     ```
6. **Run Migrations**:
   ```bash
   python app/db/migrations.py
   ```
7. **Start Server**:
   ```bash
   uvicorn main:app --reload
   ```
   - API available at `http://localhost:8000`.

### Frontend Setup
1. **Navigate**:
   ```bash
   cd ../../Frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   - Create `Frontend/.env`:
     ```env
     VITE_API_URL=http://localhost:8000
     ```
4. **Start Server**:
   ```bash
   npm run dev
   ```
   - App available at `http://localhost:5173`.

### Testing
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000/docs`
- Database: Check tables in pgAdmin (`aws_migration` > Schemas > public > Tables).

## References
- **Excel File**: Refer to the project’s Excel file in the repository for detailed step mappings and requirements.
- **boto3 Documentation**:
  - [KMS](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/kms.html)
  - [Control Tower](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/controltower.html)
  - [Organizations](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/organizations.html)
  - [SSO Admin](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sso-admin.html)
  - [CloudTrail](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cloudtrail.html)
  - [S3](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html)
  - [General boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

## Contributing
- Follow the integration steps for new scripts or features.
- Test changes thoroughly using Swagger UI and frontend.
- Update the Excel file and documentation for new steps.
- Submit pull requests with clear descriptions.

## Contact
For issues or questions, contact the development team or refer to the repository’s documentation. Provide logs or specific details for faster resolution.