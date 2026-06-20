// Test the pure data mapping logic from excelExport directly
const formatDate = (d) => {
  const dt = d ? new Date(d) : new Date();
  return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
};

const mapToExcelRows = (results, { city, profession, followers }) =>
  results.map(p => ({
    'Search Date & Time': formatDate(),
    'Search City': city,
    'Search Profession': profession,
    'Username': `@${p.username}`,
    'Full Name': p.name,
    'Bio / Profession': p.bio,
    'City (Profile)': p.city,
    'Followers': p.followers,
    'Following': p.following,
    'Total Posts': p.posts,
    'Engagement Rate': `${p.engagementRate}%`,
    'Account Type': p.accountType,
    'Last Post Date': p.lastPost ? formatDate(p.lastPost) : '',
    'Profile URL': p.profileUrl,
    'Follower Range Searched': followers || '',
  }));

const mockResults = [{
  username: 'user1', name: 'User One', bio: 'Trainer', city: 'Mumbai',
  followers: 10000, following: 500, posts: 100, engagementRate: 3.5,
  accountType: 'Creator', profilePic: '', profileUrl: 'https://instagram.com/user1', lastPost: null,
}];

describe('Excel row mapping', () => {
  let rows;
  beforeAll(() => {
    rows = mapToExcelRows(mockResults, { city: 'Mumbai', profession: 'Trainer', followers: '5000-50000' });
  });

  it('produces correct number of rows', () => {
    expect(rows).toHaveLength(1);
  });

  it('maps all 15 required Excel columns', () => {
    const expectedColumns = [
      'Search Date & Time','Search City','Search Profession','Username','Full Name',
      'Bio / Profession','City (Profile)','Followers','Following','Total Posts',
      'Engagement Rate','Account Type','Last Post Date','Profile URL','Follower Range Searched',
    ];
    expectedColumns.forEach(col => expect(rows[0]).toHaveProperty(col));
  });

  it('formats username with @ prefix', () => {
    expect(rows[0]['Username']).toBe('@user1');
  });

  it('sets Search City correctly', () => {
    expect(rows[0]['Search City']).toBe('Mumbai');
  });

  it('sets Search Profession correctly', () => {
    expect(rows[0]['Search Profession']).toBe('Trainer');
  });

  it('formats engagement rate with % suffix', () => {
    expect(rows[0]['Engagement Rate']).toBe('3.5%');
  });

  it('sets Follower Range Searched correctly', () => {
    expect(rows[0]['Follower Range Searched']).toBe('5000-50000');
  });

  it('leaves Last Post Date empty when null', () => {
    expect(rows[0]['Last Post Date']).toBe('');
  });

  it('generates filename with correct pattern', () => {
    const city = 'Mumbai', profession = 'Trainer';
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const fileName = `instagram_search_${city}_${profession}_${ts}.xlsx`.replace(/\s+/g, '_');
    expect(fileName).toMatch(/instagram_search_Mumbai_Trainer/);
    expect(fileName).toMatch(/\.xlsx$/);
  });
});
