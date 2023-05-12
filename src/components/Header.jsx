import React from "react";
import Link from "next/link";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";

const Header = () => {
  const session = useSession();
  const supabase = useSupabaseClient();

  return (
    <header className="bg-gray-900 text-white py-4 px-8 flex items-end justify-end">
      <nav className="flex items-center space-x-4">
        <Link href="/courses">
          <p className="text-white hover:text-gray-400">Courses</p>
        </Link>
        <Link href="/categories">
          <p className="text-white hover:text-gray-400">Categories</p>
        </Link>
        {session ? (
          <>
            <Link href="/account">
              <p className="text-white hover:text-gray-400">Account</p>
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-white hover:text-gray-400"
            >
              Sign Out
            </button>
          </>
        ) : (
          <button onClick={() => supabase.auth.signIn()}>
            <p className="text-white hover:text-gray-400">Sign In</p>
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
