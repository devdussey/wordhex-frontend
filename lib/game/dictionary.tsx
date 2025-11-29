
const COMMON_WORDS = new Set([
  // 3-letter words
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE',
  // 4-letter words
  'THAT', 'WITH', 'HAVE', 'THIS', 'WILL', 'YOUR', 'FROM', 'THEY', 'BEEN', 'THAN', 'THEM', 'THEN', 'MAKE', 'LIKE', 'TIME', 'JUST', 'KNOW', 'TAKE', 'COME', 'WELL', 'BACK', 'CALL', 'FIND', 'GIVE', 'HAND', 'HIGH', 'KEEP', 'LAST', 'LIFE', 'LONG', 'PART', 'WANT', 'WORD', 'WORK', 'YEAR',
  // 5-letter words
  'ABOUT', 'AFTER', 'COULD', 'EVERY', 'FIRST', 'GREAT', 'LARGE', 'NEVER', 'PLACE', 'RIGHT', 'SMALL', 'SOUND', 'STILL', 'THEIR', 'THERE', 'THESE', 'THING', 'THINK', 'THREE', 'UNDER', 'WATER', 'WHERE', 'WHICH', 'WHILE', 'WORLD', 'WOULD', 'WRITE',
  // 6+ letter words
  'PEOPLE', 'BEFORE', 'SHOULD', 'CHANGE', 'FRIEND', 'LETTER', 'PERSON', 'SCHOOL', 'SECOND', 'SYSTEM', 'MOMENT', 'NUMBER', 'ACTION', 'BECOME', 'BETTER', 'GROUND',
  // Common game words
  'AT', 'BY', 'DO', 'GO', 'IF', 'IN', 'IS', 'IT', 'ME', 'MY', 'NO', 'OF', 'ON', 'OR', 'SO', 'TO', 'UP', 'US', 'WE', 'AS', 'BE', 'HE', 'AM', 'EX', 'AX', 'OX', 'ED', 'ER', 'ATE', 'AGE', 'AIM', 'AIR', 'ART', 'ARM', 'ACE', 'AGO', 'ADS', 'APE', 'ADD', 'BAD', 'BAG', 'BAR', 'BAT', 'BED', 'BIG', 'BIT', 'BOX', 'BUS', 'BUY', 'CAR', 'CAT', 'CRY', 'CUT', 'DAM', 'DRY', 'EAR', 'EAT', 'EGG', 'END', 'EYE', 'FAN', 'FAR', 'FAT', 'FEW', 'FLY', 'FOX', 'FUN', 'GAS', 'GAY', 'GOD', 'GOT', 'GUN', 'GUY', 'HAT', 'HAD', 'HAM', 'HAY', 'HIT', 'HOT', 'HUG', 'ICE', 'ILL', 'INK', 'JAM', 'JAR', 'JOB', 'JOY', 'KEY', 'LAP', 'LAW', 'LAY', 'LEG', 'LID', 'LIP', 'LOG', 'LOT', 'LOW', 'MAD', 'MAN', 'MAP', 'MAT', 'MEN', 'MET', 'MIX', 'MOM', 'MUD', 'NET', 'NOR', 'ODD', 'OFF', 'OIL', 'PAN', 'PAT', 'PAY', 'PEN', 'PET', 'PIE', 'PIG', 'PIN', 'PIT', 'POT', 'RAN', 'RAT', 'RAW', 'RED', 'RID', 'RIM', 'RUN', 'SAD', 'SAT', 'SAW', 'SEA', 'SET', 'SIT', 'SIX', 'SKY', 'SUN', 'TAP', 'TAR', 'TAX', 'TEA', 'TEN', 'THE', 'TIE', 'TIP', 'TOP', 'TRY', 'VAN', 'WAR', 'WET', 'WIG', 'WIN', 'WON', 'YES', 'YET', 'ZOO'
]);

export async function validate(word: string): Promise<boolean> {
  // Normalize to uppercase for comparison
  const normalized = word.toUpperCase();

  // Check if word is in our dictionary
  return COMMON_WORDS.has(normalized);
}
