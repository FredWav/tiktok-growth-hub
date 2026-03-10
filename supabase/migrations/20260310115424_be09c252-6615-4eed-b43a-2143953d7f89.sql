UPDATE client_screenshots
SET display_locations = array_remove(display_locations, 'home')
WHERE 'home' = ANY(display_locations)
AND id NOT IN (
  'b90b7c15-89f6-4c23-9a4e-8a1279f06bc6',
  '0e514762-2dee-44c0-acfd-0f083fc852c2',
  'a87840cc-647a-4295-a405-10d5fefa64f6'
);