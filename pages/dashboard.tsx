import Head from "next/head";
import { useEffect } from "react";
import { Can } from "../components/Can";
import { useAuthContext } from "../context/AuthContext";
import { setupAPIClient } from "../services/api";
import { api } from "../services/apiClient";

import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { user, signOut } = useAuthContext();

  const permissions = ["metrics.list"];

  useEffect(() => {
    api
      .get("/me")
      .then((response) => {
        console.log(response.data);
      })
      .catch((err) => console.error(err));
  }, []);
  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>

      <h1>Dashboard: {user.email}</h1>

      <button onClick={signOut}>Sign out</button>

      <Can permissions={permissions}>
        <div>Metrics</div>
      </Can>
    </>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);

  const response = await apiClient.get("/me");
  console.log(response.data);

  return {
    props: {},
  };
});
