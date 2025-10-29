Date parsing notes for chat analyzer

Supported date formats (WhatsApp / Telegram / Facebook exports):

- YYYY/MM/DD, HH:MM  (e.g. 2023/11/30, 07:52)
- DD/MM/YYYY, HH:MM  (e.g. 30/11/2023, 07:52)
- MM/DD/YY, HH:MM    (e.g. 12/25/23, 13:30)
- DD/MM/YY, HH:MM    (e.g. 07/12/23, 10:05)
- D/M/YY or D/M/YYYY variations (single-digit day/month allowed)
- Separators allowed: '/', '-', '.' (dots are normalized for telegram-style dates)
- Time may include seconds (HH:MM:SS) and optional AM/PM (e.g., 1:05 pm)

Notes:
- Ambiguous two-part dates (where both day and month <= 12) default to DD/MM/YY as used by most WhatsApp exports.
- System messages without a sender (e.g., "You created this group") are detected and skipped by the main parser when appropriate.
- If you find an unsupported format, please open an issue with an example line and we'll add support.
