# Add Company Printer / Client-Owned Printer Logic

## Overview

The "Add Company Printer" feature allows an admin to add a new printer to the catalog, inventory, and automatically assign it to the current client with `client_owned` status. This is accessible from the `/clients/{clientId}` page for admin users.

---

## UI/UX Integration

- **Location:** Appears as a purple option in the AddButtonNavigation dropdown on `/clients/{clientId}` (admin only).
- **Modal:** Opens a form modal (`AddCompanyPrinterModal`) for entering printer details and assignment info.
- **Form Fields:**
  - Printer Name (required)
  - Manufacturer (required)
  - Model, Series, Color, Image URL (optional)
  - Rental Eligible (toggle)
  - Serial Number (optional)
  - Department/Location (optional, from client departments)
  - Notes (optional)
- **Info Box:** Explains that the printer will be added to the catalog, inventory, and assigned to the client as `client_owned`.
- **Validation:** Requires at least name and manufacturer.
- **Feedback:** Shows toast notifications for success or error.

---

## Backend/Database Logic

### 1. Add to Catalog
- **Table:** `printers`
- **Fields:** name, manufacturer, model, series, color, image_url, rental_eligible, status ('active')
- **Operation:** Insert new printer record

### 2. Add to Inventory & Assign to Client
- **Table:** `printer_assignments`
- **Fields:**
  - `printer_id`: ID of the newly created printer
  - `client_id`: Current client
  - `serial_number`: From form
  - `usage_type`: `'client_owned'` (always set)
  - `department_location_id`: From form (optional)
  - `status`: `'active'`
  - `assignment_effective_date`: Today
  - `notes`: From form
- **Operation:** Insert new assignment record

---

## Integration Points

- **AddButtonNavigation.tsx**: Adds a new menu option for "Add Company Printer" (purple, only on client pages, admin only)
- **AddCompanyPrinterModal.tsx**: Modal form for adding and assigning the printer
- **ClientDashboardSearch.tsx**: Handles modal state and data refresh after addition

---

## Security & Access
- **Only visible to admin users**
- **Only available on `/clients/{clientId}`**

---

## Future Considerations
- Extend assignment logic for more usage types if needed
- Add more validation or custom fields as business logic evolves
- Consider audit logging for these actions
- Add support for file/image upload for printer images

---

## Example Flow
1. Admin clicks "Add Company Printer" on a client page
2. Fills out the form and submits
3. Printer is added to `printers` (catalog)
4. Assignment is created in `printer_assignments` with `usage_type = 'client_owned'` and assigned to the current client
5. UI refreshes to show the new printer in the client's inventory 