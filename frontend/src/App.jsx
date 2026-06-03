import {Routes, Route ,Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import ProblemPage from "./pages/editor";
import { fetchUserState } from "./userslice";
import { fetchProblems } from "./problemslice";
import BinarySearchVisualizer from "./pages/visu";
import Admin from "./pages/admin";
import AdminPanel from "./component/creat";
import DSAVisualizer from "./pages/visu";
import Explore from "./pages/expore";
import Profiledad from "./pages/profile";
import ContactPage from "./pages/connect";
import ContestPage from "./pages/context";
import AdminVideo from "./component/adminvideo";
import AdminUpload from "./component/Adminupload";
import ArenaChat from "./component/discord"
import Updateproblem from "./component/updatepeoblem";
import AdminUpdate from "./component/Adminupdate";
import Profilepage from "./component/profile"
function App(){
  const dispatch = useDispatch();
  const {isAuthenticated,user} = useSelector((state)=>state.auth);
  
  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
    dispatch(fetchUserState());
    dispatch(fetchProblems());
  }, [dispatch]);

const MOCK_USER = {
  name: "Manisg singh",
  email: "manish.singh@gmail.com",
  username: "Hunter",
  joinedAt: "January 2024",
  avatar: null,
  stats: {
    easy: 2,
    medium: 0,
    hard: 0,
    rank: 1,
    total: 2,
  },
  platform: {
    easy: 820,
    medium: 1340,
    hard: 540,
    total: 2400,
  },
  streak: 5,
  submissions: 8,
  acceptanceRate: 75,
  languages: ["JavaScript", "C++"],
  recentActivity: [
    { title: "Two Sum", difficulty: "Easy", status: "Accepted", time: "2h ago" },
    { title: "Valid Parentheses", difficulty: "Easy", status: "Accepted", time: "1d ago" },
  ],
  badges: [
    { icon: "🔥", label: "5-Day Streak" },
    { icon: "⚡", label: "First Solve" },
  ],
};

  return(
  <>
    <Routes>
      <Route path="/" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      <Route path="/problem/:problemId" element={<ProblemPage></ProblemPage>}></Route>
      <Route path="/profile" element={<Profilepage></Profilepage>}></Route>
        <Route path="/admin" element={isAuthenticated && user?.role == 'admin' ? <Admin /> : <Navigate to="/" />} />
      <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="/explore/dsa-visualizer" element={<DSAVisualizer></DSAVisualizer>}></Route>
      <Route path="/explore" element={<Explore></Explore>}></Route>
      <Route path="/discuss" element={<ContactPage></ContactPage>}></Route>
      <Route path="/contest" element={<ContestPage></ContestPage>}></Route>
      <Route path="/admin/video" element={<AdminVideo></AdminVideo>}></Route>
      <Route path="/admin/upload/:problemId" element={<AdminUpload></AdminUpload>}/>
      <Route path="/arechat" element={<ArenaChat/>}></Route>
      <Route path="/admin/update" element={<Updateproblem></Updateproblem>}></Route>
      <Route path="/admin/update/:problemId" element={<AdminUpdate></AdminUpdate>}/>
    </Routes>
  </>
  )
}

export default App;