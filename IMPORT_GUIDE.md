# Owner spreadsheet import

Download the CSV or XLSX template from /admin/import. The first worksheet is read for XLSX. Use UTF-8 and a header row for CSV. Use all headers in the template order. A file may contain up to 200 data rows and be at most 2 MB. Split larger submissions.

| Column | Value |
| --- | --- |
| slug | Stable unique lowercase ASCII words joined with hyphens |
| name | Model or display name |
| brand_id | Existing brand slug |
| category_id | Existing category slug |
| price | Nonnegative AZN amount with up to two decimals, using a decimal point |
| storage, color | Optional text, retained for selection and WhatsApp order details |
| status | draft or published; blank defaults to draft |

Use a separate slug per priced configuration. Start with a draft. An import previews new and matched slugs and requires confirmation. Duplicate slugs in a file, unknown references, invalid rows and archival status prevent import. Saving uses one PostgreSQL upsert statement. Existing photos, localized descriptions and specifications are outside the import column set. A matching slug updates the supplied price/status; cells left empty in the storage and color columns clear those values. Products absent from the file are untouched.

Upload images on each saved product. Filesystem image references and remote image URLs are not fetched. Store owners must hold the rights to their data and images. Only original owner-provided data belongs in import files. The included template contains headers only.
