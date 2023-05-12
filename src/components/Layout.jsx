import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import {
  // Import predefined theme
  ThemeSupa,
} from "@supabase/auth-ui-shared";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import Header from "./Header";

const Layout = ({ children }) => {
  const session = useSession();
  const supabase = useSupabaseClient();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {!session ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              theme="dark"
            />
          </div>
        </div>
      ) : (
        <main className="flex-grow">{children}</main>
      )}
    </div>
  );
};

export default Layout;
