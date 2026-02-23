import { print } from "graphql";
import { URLs } from "./constants";
import { shouldBypassCache } from "./subgraphCacheBypass";

const getDataFromSubgraph = async (query: unknown) => {
  try {
    const queryStr = typeof query === "string" ? query : print(query as import("graphql").DocumentNode);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (shouldBypassCache()) headers["x-bypass-cache"] = "true";
    const res = await fetch(URLs.SubgraphAPI, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: queryStr }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { isSuccess: false, data: "" };
    }
    return { isSuccess: json.isSuccess !== false, data: json.data ?? "" };
  } catch (error) {
    return { isSuccess: false, data: "" };
  }
};

export const getUserRole = async (account: any) => {
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

/** Returns current user's dcategory and role (e.g. for division leader's My Team). */
export const getCurrentUserProfile = async (account: string) => {
  const query = `{
    user(id: "${account.toLowerCase()}") {
      dcategory
      role
      firstName
      lastName
      email
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    return (res.data as { user?: { dcategory?: number; role?: number; firstName?: string; lastName?: string; email?: string } }).user ?? null;
  } catch (e) {
    console.error(e, "============ error in getCurrentUserProfile ============");
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

export const getAllMemebers = async () => {
  let query = `{
    users(where: {role_gt: 0}) {
      id
      firstName
      lastName
      email
      dcategory
      role
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const users = (res.data as any).users || [];
    const grouped = groupUsersByDivision(users);

    // Add legal team members (role 3) to Legal division (dcategory 1)
    // Legal division users have dcategory = 0, add them as leader
    users.forEach((user: User) => {
      const role = Number(user.role);
      if (role === 3) { // Legal Team
        grouped[0] = { leader: user, members: [] };
      }
    });

    return grouped;
  } catch (e) {
    console.log(e, "============error in get all users from subgraph============");
    return {};
  }
};

export const getAllDivisionLeadersAndMembers = async () => {
  let query = `{
    users(where: {dcategory_gt: 0}) {
      id
      firstName
      lastName
      email
      dcategory
      role
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const users = (res.data as any).users || [];
    return groupUsersByDivision(users);
  } catch (e) {
    console.log(e, "============error in get all users from subgraph============");
    return {};
  }
}

export const getAllDivisionLeaders = async () => {
  let query = `{
    users(where: {role: 2}) {
      id
      dcategory
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const leaders = (res.data as any).users || [];

    return leaders;
  } catch (e) {
    console.log(e, "============error in get all division leaders from subgraph============");
    return [];
  }
}

export const getDivisionMembersByDivisionId = async (divisionId: number) => {
  let query = `{
    users(where: {dcategory: ${divisionId}, role: 1}) {
      id
      firstName
      lastName
      email
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const members = (res.data as any).users || [];

    return members;
  } catch (e) {
    console.log(e, "============error in get all division leaders from subgraph============");
    return [];
  }
}

export const getAllClients = async () => {
  let query = `{
    users(where: {role: 5}) {
      id
      firstName
      lastName
      email
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const clients = (res.data as any).users || [];

    return clients;
  } catch (e) {
    console.log(e, "============error in get all clients from subgraph============");
    return [];
  }
}

export const getAllContracts = async () => {
  let query = `{
    documents {
      id
      client {
        id
        firstName
        email
        lastName
      }
      category
      title
      cid
      status
      createdAt
      sections {
        id
        status
      }
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const contracts = (res.data as any).documents || [];

    return contracts;
  } catch (e) {
    console.log(e, "============error in get all clients from subgraph============");
    return [];
  }
}

export const getContractsByClient = async (client: string) => {
  let query = `{
    documents(where: {client_: {id: "${client}"}}) {
      id
      category
      title
      cid
      status
      createdAt
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const contracts = (res.data as any).documents || [];

    return contracts;
  } catch (e) {
    console.log(e, "============error in get all contracts by client from subgraph============");
    return [];
  }
}

export const getContractById = async (id: string | number) => {
  const idStr = String(id);
  const query = `{
    document(id: "${idStr}") {
      id
      client {
        id
        firstName
        email
        lastName
      }
      category
      title
      cid
      status
      createdAt
      sections {
        id
        cid
        status
        divisionLeader {
          dcategory
          firstName
          lastName
        }
      }
      clientESign {
        id
        date
        cid
      }
      legalESign {
        id
        date
        cid
      }
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const doc = (res.data as any).document;
    return doc ?? null;
  } catch (e) {
    console.log(e, "============error in get contract by id from subgraph============");
    return null;
  }
};

export const getSectionsByDivisionLeader = async (divisionLeaderId: string) => {
  const query = `{
    sections(where: {divisionLeader: "${divisionLeaderId}"}) {
      id
      cid
      assignedAt
      status
      divisionLeader {
        dcategory
        firstName
        lastName
      }
      clauses {
        id
        cid
        assignedAt
        status
        rejectReason
        divisionMember {
          id
          firstName
          lastName
          email
        }
      }
      doc {
        id
        title
        category
        status
        client {
          firstName
          lastName
        }
        createdAt
      }
    }
  }`;

  try {
    const res = await getDataFromSubgraph(query);
    const sections = (res.data as any).sections || [];
    return sections;
  } catch (e) {
    console.log(e, "============error in get sections by division leader from subgraph============");
    return [];
  }
}

export const getClausesByDivisionMember = async (divisionMemberId: string) => {
  const memberId = divisionMemberId.toLowerCase();
  const query = `{
    clauses(where: {divisionMember: "${memberId}"}) {
      id
      cid
      assignedAt
      status
      rejectReason
      section {
        id
        cid
        status
        doc {
          id
          title
          status
          createdAt
          category
          client {
            firstName
            lastName
          }
        }
      }
      divisionMember {
        id
        firstName
        lastName
      }
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const clauses = (res.data as any).clauses || [];
    return clauses;
  } catch (e) {
    console.log(e, "============error in get contracts by division member from subgraph============");
    return [];
  }
}

export const getClauseHistories = async (clauseId: string) => {
  const query = `{
    clauseHistories(orderBy: date, where: {clause: "${clauseId}"}) {
      type
      id
      date
      cid
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const histories = (res.data as any).clauseHistories || [];
    return histories;
  } catch (e) {
    console.log(e, "============error in get histories by clauseId from subgraph============");
    return [];
  }
}

export const getSectionHistories = async (sectionId: string) => {
  const query = `{
    sectionHistories(orderBy: date, where: {section: "${sectionId}"}) {
      type
      id
      date
      cid
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const histories = (res.data as any).sectionHistories || [];
    return histories;
  } catch (e) {
    console.log(e, "============error in get histories by sectionId from subgraph============");
    return [];
  }
}

export const getContractHistories = async (docId: string) => {
  const query = `{
    docHistories(orderBy: date, where: {document: "${docId}"}) {
      type
      id
      date
      cid
    }
  }`;
  try {
    const res = await getDataFromSubgraph(query);
    const histories = (res.data as any).docHistories || [];
    return histories;
  } catch (e) {
    console.log(e, "============error in get histories by docId from subgraph============");
    return [];
  }
}



interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dcategory?: number;
  role?: number;
}

interface DivisionGroup {
  leader: User | null;
  members: User[];
}

export const groupUsersByDivision = (users: User[]): Record<number, DivisionGroup> => {
  const grouped: Record<number, DivisionGroup> = {};

  // Initialize all divisions with empty leader and members
  // Division categories: 1-9 (excluding 0 which is NO_DIVISION)
  for (let i = 1; i <= 9; i++) {
    grouped[i] = {
      leader: null,
      members: []
    };
  }

  // Group users by division category
  users.forEach((user) => {
    if (!user.dcategory || user.dcategory === 0) {
      return; // Skip users without a division
    }

    const division = Number(user.dcategory);
    const role = Number(user.role);

    // Role 1 = Division Member, Role 2 = Division Leader
    if (role === 1) {
      // Division Member
      grouped[division].members.push(user);
    } else if (role === 2) {
      // Division Leader
      grouped[division].leader = user;
    }
  });

  return grouped;
}

