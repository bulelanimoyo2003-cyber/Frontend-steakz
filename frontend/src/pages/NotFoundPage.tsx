import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="hero">
      <span style={{ color: 'var(--cognac)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
        Error
      </span>
      <h1 style={{ fontSize: 'clamp(5rem, 15vw, 9rem)', fontStyle: 'italic', marginTop: '0.25rem' }}>404</h1>
      <div className="ornament">Page not found</div>
      <p>This page doesn't exist in our system.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
        Return Home
      </Link>
    </div>
  );
}
