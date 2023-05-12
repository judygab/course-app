import { useState, useEffect } from "react";
import supabase from "../lib/supabase";
import { FaRegBookmark, FaBookmark } from "react-icons/fa";

const EnrollButton = ({ courseId, userId }) => {
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrolled() {
      if (!userId) {
        return;
      }

      const { data } = await supabase
        .from("user_saved_courses")
        .select("course_id")
        .eq("user_id", userId);

      const enrolledCourses = data.map((entry) => entry.course_id);
      setEnrolled(enrolledCourses.includes(courseId));
      setLoading(false);
    }

    fetchEnrolled();
  }, [userId, courseId]);

  async function handleEnrollClick() {
    if (!userId) {
      // Redirect to login page if user is not logged in
      window.location.href = "/api/auth/login";
      return;
    }

    if (enrolled) {
      // Remove the saved course if already saved
      await supabase
        .from("user_saved_courses")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", courseId);
      setEnrolled(false);
    } else {
      // Save the course if not already saved
      await supabase.from("user_saved_courses").insert({
        user_id: userId,
        course_id: courseId,
      });
      setEnrolled(true);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <button onClick={handleEnrollClick}>
      {enrolled ? (
        <FaBookmark color="#4caf50" size="1.5em" />
      ) : (
        <FaRegBookmark color="#4caf50" size="1.5em" />
      )}
    </button>
  );
};

export default EnrollButton;
