## Tech Stack:
* Next.js
* Supabase
* Tailwind

## Setting Up Supabase
1. Create a project at [https://supabase.com/](https://supabase.com/)
2. Create `.env` file in the root of your project and add:
  ```
  NEXT_PUBLIC_SUPABASE_URL=Your URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY=Your key
  ```
  
## Data Schema
Here is the list of queries you can run in supabase SQL editor:
<details>
<summary>Create Courses Table</summary>
  ```
    INSERT INTO courses (title, description, category, price)
  VALUES 
    ('Introduction to Web Development', 'Learn the basics of web development with HTML, CSS, and JavaScript.', 'Web Development', 29.99),
    ('Python for Data Science', 'Master Python programming for data science and machine learning.', 'Data Science', 49.99),
    ('JavaScript Fundamentals', 'Deep dive into JavaScript fundamentals and build modern web applications.', 'Web Development', 39.99),
    ('Introduction to Artificial Intelligence', 'Learn the basics of artificial intelligence and machine learning.', 'Artificial Intelligence', 59.99),
    ('Database Design and Management', 'Master the principles of database design and management for efficient data storage.', 'Database Management', 34.99);
  ```
  </details>
  
  <details>
<summary>Create Categories Table</summary>
  ```
    -- Create the categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Insert sample data into categories table
INSERT INTO categories (name) VALUES ('Math');
INSERT INTO categories (name) VALUES ('Science');
INSERT INTO categories (name) VALUES ('History');

  ```
  </details>
  
    <details>
<summary>Create Course Category Relationship</summary>
  ```
-- Add a 'category_id' column of type UUID to the 'courses' table
ALTER TABLE courses ADD COLUMN category_id UUID;

-- Create the courses_categories junction table
CREATE TABLE courses_categories (
  id SERIAL PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE
);

-- Add a unique constraint to prevent duplicate links
ALTER TABLE courses_categories
ADD CONSTRAINT unique_course_category
UNIQUE (course_id, category_id);
  ```
  </details>
  
      <details>
<summary>User Management</summary>
For this step to work don't forget to enable authentication
  ```
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up Storage!
insert into storage.buckets (id, name)
  values ('avatars', 'avatars');

-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage#policy-examples for more details.
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');
  ```
  </details>
  
      <details>
<summary>Next Auth Schema Setup</summary>
  ```
--
-- Name: next_auth; Type: SCHEMA;
--
CREATE SCHEMA next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

--
-- Create users table
--
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);

GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

--- uid() function to be used in RLS policies
CREATE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

--
-- Create sessions table
--
CREATE TABLE IF NOT EXISTS  next_auth.sessions
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessionToken_unique UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES  next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

--
-- Create accounts table
--
CREATE TABLE IF NOT EXISTS  next_auth.accounts
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    oauth_token_secret text,
    oauth_token text,
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES  next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

--
-- Create verification_tokens table
--
CREATE TABLE IF NOT EXISTS  next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_unique UNIQUE (token),
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);

GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;
  ```
  </details>
  
      <details>
<summary>Create Profiles Table</summary>
  ```
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN gender TEXT;
ALTER TABLE profiles ADD COLUMN birthdate DATE;

  ```
  </details>
  
        <details>
<summary>Add User Saved Courses to Profiles</summary>
  ```
-- Create user_saved_courses table
CREATE TABLE user_saved_courses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a unique constraint to prevent duplicate saves
ALTER TABLE user_saved_courses
ADD CONSTRAINT unique_user_course
UNIQUE (user_id, course_id);

-- Update courses table to add a 'saved_count' column that tracks the number of times a course has been saved
ALTER TABLE courses
ADD COLUMN saved_count INT DEFAULT 0;

-- Update user_saved_courses table to increment the saved_count column of a course when a new saved course is created
CREATE OR REPLACE FUNCTION increment_saved_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET saved_count = saved_count + 1
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_saved_count_trigger
AFTER INSERT ON user_saved_courses
FOR EACH ROW
EXECUTE FUNCTION increment_saved_count();

-- Update user_saved_courses table to decrement the saved_count column of a course when a saved course is deleted
CREATE OR REPLACE FUNCTION decrement_saved_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET saved_count = saved_count - 1
  WHERE id = OLD.course_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_saved_count_trigger
AFTER DELETE ON user_saved_courses
FOR EACH ROW
EXECUTE FUNCTION decrement_saved_count();


  ```
  </details>



## Run the application

Install the modules:

```bash
npm install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
