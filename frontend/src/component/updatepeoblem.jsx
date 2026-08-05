import { useState } from 'react';
import axiosClient from '../utils/axiosClient'
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import BackButton from './backbutton';
const Updateproblem = () => {
  const dispatch = useDispatch();
  const { problems, loading, error } = useSelector(
    (state) => state.problem
  );

  // local list so UI updates instantly after delete, without needing
  // to know your exact redux slice's action names
  const [localProblems, setLocalProblems] = useState(null);
  const list = localProblems ?? problems;

  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (problem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${problem.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(problem._id);
      await axiosClient.delete(`/problem/deleteproblem/${problem._id}`);
      setLocalProblems((prev) => (prev ?? problems).filter((p) => p._id !== problem._id));
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
      alert(err.response?.data || "Failed to delete problem. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-error shadow-lg my-4">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error.response.data.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
        <BackButton></BackButton>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">update problem</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="w-1/12">#</th>
              <th className="w-3/12">Title</th>
              <th className="w-2/12">Difficulty</th>
              <th className="w-3/12">Tags</th>
              <th className="w-3/12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((problem, index) => (
              <tr key={problem._id}>
                <th>{index + 1}</th>
                <td>{problem.title}</td>
                <td>
                  <span className={`badge ${
                    problem.difficulty === 'easy'
                      ? 'badge-success'
                      : problem.difficulty === 'medium'
                        ? 'badge-warning'
                        : 'badge-error'
                  }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td>
                  <span className="badge badge-outline">
                    {problem.tags}
                  </span>
                </td>
                <td>
                  <div className="flex space-x-2">
                    <NavLink
                      to={`/admin/update/${problem._id}`}
                      className="btn btn-sm bg-blue-600 text-white"
                    >
                      Update
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => handleDelete(problem)}
                      disabled={deletingId === problem._id}
                      className="btn btn-sm bg-red-600 text-white disabled:opacity-50"
                    >
                      {deletingId === problem._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Updateproblem;