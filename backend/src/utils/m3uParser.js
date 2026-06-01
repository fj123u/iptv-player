export function parseM3U(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  const channels = [];

  if (!lines[0]?.startsWith('#EXTM3U')) {
    throw new Error('Format M3U invalide');
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);

      const name = nameMatch ? nameMatch[1].trim() : 'Sans nom';
      const logo = logoMatch ? logoMatch[1] : null;
      const group = groupMatch ? groupMatch[1] : 'Non classé';

      const nextLine = lines[i + 1];
      if (nextLine && !nextLine.startsWith('#')) {
        channels.push({
          name,
          url: nextLine.trim(),
          logo,
          group_name: group
        });
        i++;
      }
    }
  }

  return channels;
}
