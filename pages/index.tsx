import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { parseCookies } from "nookies";
import { FormEvent, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import styles from "../styles/Home.module.css";
import { withSSRGuest } from "../utils/withSSRGuest";

const Home: NextPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signIn } = useAuthContext();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const data = {
      email,
      password,
    };

    await signIn(data);
  }

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div className={styles.container}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" onClick={handleSubmit}>
          Entrar
        </button>
      </div>
    </>
  );
};

export default Home;

export const getServerSideProps = withSSRGuest<{
  users: string[];
}>(async (ctx) => {
  return {
    props: {
      users: [""],
    },
  };
});
