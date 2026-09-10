# Platform Login Credentials

## Demo accounts

These credentials are defined in the frontend demo configuration and work only when the frontend environment variable below is enabled:

```env
VITE_ENABLE_DEMO_MODE=true
```

| Role | Email | Password |
|---|---|---|
| Admin | `demo@admin.carterscare.com` | `CartersCare2025!` |
| Manager | `demo@manager.carterscare.com` | `CartersCare2025!` |
| Support Worker | `demo@worker.carterscare.com` | `CartersCare2025!` |
| Client | `demo@client.carterscare.com` | `CartersCare2025!` |

## Production accounts

Production staff accounts authenticate through Supabase Auth. No production email addresses or passwords are stored in this repository, so they cannot be listed here. Create or manage production users through the Supabase Auth dashboard or the platform's approved account-management workflow.

## Security notes

- Demo mode is disabled unless `VITE_ENABLE_DEMO_MODE=true` is explicitly configured.
- Do not use the demo password for real users.
- Do not commit production passwords, service-role keys, or other secrets to the repository.
- Rotate the demo password before sharing access outside an internal presentation or test environment.
- Treat demo records as synthetic presentation data, not real client records.

_Last verified against the current frontend demo configuration._
