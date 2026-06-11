import { Link } from 'react-router-dom';

const LOCATIONS = [
  'City Centre',
  'Northside',
  'Southgate',
  'East Quarter',
  'Westfield',
  'Marina Bay',
  'Uptown',
];

export default function LandingPage() {
  return (
    <div>
      <div className="hero">
        <div className="ornament">Est. 2024</div>
        <h1>Steakz</h1>
        <p>
          Seven locations. One obsession. Premium cuts, masterfully prepared — reserve your
          table and experience the difference.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/menu" className="btn btn-primary">
            Explore Menu
          </Link>
          <Link to="/register" className="btn btn-outline">
            Reserve a Table
          </Link>
        </div>
      </div>

      <div className="page" style={{ paddingTop: '1rem' }}>
        <div className="section-title">Our Locations</div>
        <div className="card-grid">
          {LOCATIONS.map((loc) => (
            <div className="card" key={loc} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--cognac)', fontSize: '1rem' }}>✦</span>
              <div>
                <span className="card-label">Steakz</span>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {loc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
