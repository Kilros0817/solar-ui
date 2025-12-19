import axios from "axios";
import { URLs } from "./constants";

const getDataFromSubgraph = async (query: any) => {
  try {
    const result = await axios.post(URLs.SubgraphURL, {
      query,
    });

    return { isSuccess: true, data: result.data && (result.data as any).data };
  } catch (error) {
    return { isSuccess: false, data: "" };
  }
};

export const getUserInfo = async (account: any) => {
  let query = `{
    user(id: "${account}") {
      firstName
      lastName
      email
      onPending
    }
  }`;

  try {
    const res = await getDataFromSubgraph(query);
    const user = (res.data as any).user;

    return user;
  } catch (e) {
    console.log(e, "============error in get user pending list from subgraph============");
    return null;
  }
}

export const getPendingUsers = async () => {

  let query = `{
    users(where: {onPending: true}) {
      id
      firstName
      lastName
      email
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    return (res.data as any).users;
  } catch (e) {
    console.log(e, "============error in get user pending list from subgraph============");
    return [];
  }
};

