import { Link } from 'react-router-dom';

function PlaceholderScreen({ title }) {
  return (
    <div>
      <h1>{title} - Coming Soon</h1>
      <Link to="/">Back</Link>
    </div>
  );
}
export default PlaceholderScreen;