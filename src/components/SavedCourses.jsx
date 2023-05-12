import { useState, useEffect } from "react";
import supabase from "../lib/supabase";

export default function Account({ userId }) {
  const [savedCourses, setSavedCourses] = useState([]);

  useEffect(() => {
    async function fetchSavedCourses() {
      if (userId) {
        const { data, error } = await supabase
          .from("user_saved_courses")
          .select("course_id")
          .eq("user_id", userId);
        console.log(data);
        if (error) console.log("Error fetching saved courses:", error.message);
        else {
          const courseIds = data.map((savedCourse) => savedCourse.course_id);
          const { data: coursesData, error: coursesError } = await supabase
            .from("courses")
            .select("*")
            .in("id", courseIds);
          if (coursesError)
            console.log("Error fetching courses:", coursesError.message);
          else setSavedCourses(coursesData);
        }
      }
    }
    fetchSavedCourses();
  }, []);

  return (
    <div>
      <h1>Your saved courses:</h1>
      <ul>
        {savedCourses.map((course) => (
          <li key={course.id}>{course.title}</li>
        ))}
      </ul>
    </div>
  );
}
