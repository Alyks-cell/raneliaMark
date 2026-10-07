# raneliaMark

## RSVP database

Run `supabase-setup.sql` in the Supabase Dashboard SQL Editor. It creates
`wedding_rsvps_yes` and `wedding_rsvps_no`, copies existing responses from
`wedding_rsvps` into the matching table, and removes the old mixed table.
The RSVP form routes each submission to the matching table.
