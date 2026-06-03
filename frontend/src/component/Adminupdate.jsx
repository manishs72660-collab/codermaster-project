import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axiosClient from '../utils/axiosClient';

function AdminUpdate() {
  const { problemId } = useParams();
  const[problem,setproblem]=useState([]);
  console.log(problem?.data);
  // ================= FORMAT FILE SIZE =================
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await axiosClient.get(`/problem/admin/${problemId}`);
        setproblem(response);
      } catch (err) {
        console.log("not fatch sucessfully");
      }
    };
    fetchSubmissions();
  }, [problemId]);
  
  return (
   <>
   <h1>{`problem id is ${problemId}`}</h1>
   </>
  );
}

export default AdminUpdate;