# XeroxQ Technical Support Playbook (L1-L3)

This document provides a professional framework for troubleshooting the XeroxQ platform. Access these tools only when authorized.

## 🛠️ L3 Diagnostics Tools (Engineering Support)
Use the following endpoint to get a full technical report for any shop.
**Endpoint**: `/api/support/debug?shopId=[UUID]`
**Auth**: Requires `Authorization: Bearer [CRON_SECRET]`

### Report Contents:
- **Shop Status**: `is_active` (billing) vs `is_open` (manual).
- **Processing Health**: Last 50 jobs success/failure rate.
- **Financial Status**: Current platform balance.

---

## 🔍 Common Issue Troubleshooting

### 1. "Shop is Closed/Under Maintenance" (WhatsApp)
- **Check**: Is the shop deactivated due to a negative balance?
- **Solution**: Use the `/api/support/debug` tool. If `is_active` is FALSE, the shop has exceeded the -₹500 debt limit. They must settle their dues to reactivate.

### 2. "Files are not being processed" (Stuck in Pending)
- **Check**: Is the worker secret correct in the environment?
- **Solution**: Check server logs for `[SECURITY] Rejected unauthorized worker request`. If many jobs are stuck, the Janitor (`/api/cron/cleanup`) will automatically attempt a retry every day.

### 3. "WhatsApp returns 'Internal Error'"
- **Check**: Twilio Signature verification.
- **Solution**: If you recently changed your domain or protocol (HTTP vs HTTPS), the signature will fail. Ensure `TWILIO_AUTH_TOKEN` is synced.

---

## 🚨 Tiered Support Levels

| Level | Responsible | Scope |
| :--- | :--- | :--- |
| **L1 (General)** | Shop Owner | Managing shop hours, price list, and basic help to customers. |
| **L2 (Admin)** | CEO / Platform Admin | Managing shop tenant lifecycle, billing overrides, and manual reactivation. |
| **L3 (Tech)** | Engineering | Infrastructure health, worker secret management, and codebase updates. |

---

## 📊 Monitoring
All support-impacting events are logged with the prefix `[SUPPORT]`. Review these logs daily to identify shops with high failure rates.
