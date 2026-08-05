import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="btn btn-ghost btn-sm gap-2 mb-4"
    >
      <ArrowLeft size={18} />
      Back
    </button>
  );
}

export default BackButton;