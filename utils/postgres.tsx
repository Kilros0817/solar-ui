import { URLs } from "./constants";

const fetchFromAPI = async (endpoint: string, queryParams?: Record<string, string | number | boolean>) => {
  try {
    const url = new URL(`${URLs.PostgresAPI}${endpoint}`);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    const res = await fetch(url.toString());
    const json = await res.json();

    if (!res.ok || !json.isSuccess) {
      return { isSuccess: false, data: null };
    }
    return { isSuccess: true, data: json.data };
  } catch (error) {
    console.error("API fetch error:", error);
    return { isSuccess: false, data: null };
  }
};

export const getUserRole = async (account: any) => {
  try {
    const res = await fetchFromAPI(`/users/${account}`);
    return res.data;
  } catch (e) {
    console.log(e, "============error in get user role from postgres============");
    return null;
  }
}

export const getUserInfo = async (account: any) => {
  try {
    const res = await fetchFromAPI(`/users/${account}`);
    return res.data;
  } catch (e) {
    console.log(e, "============error in get user info from postgres============");
    return null;
  }
}

/** Returns current user's dcategory and role (e.g. for division leader's My Team). */
export const getCurrentUserProfile = async (account: string) => {
  try {
    const res = await fetchFromAPI(`/users/${account.toLowerCase()}`);
    return res.data ?? null;
  } catch (e) {
    console.error(e, "============ error in getCurrentUserProfile ============");
    return null;
  }
}

export const getPendingUsers = async () => {
  try {
    const res = await fetchFromAPI("/users", { onPending: true });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get pending users from postgres============");
    return [];
  }
};

export const getAllMemebers = async () => {
  try {
    const res = await fetchFromAPI("/users", { role_gt: 0 });
    const users = res.data || [];
    const grouped = groupUsersByDivision(users);

    // Add all legal team members (role 3) to Legal division (dcategory 0) as multiple leaders
    const legalUsers = users.filter((user: User) => Number(user.role) === 3);
    if (legalUsers.length > 0) {
      grouped[0] = { leader: null, members: legalUsers };
    }

    return grouped;
  } catch (e) {
    console.log(e, "============error in get all users from postgres============");
    return {};
  }
};

export const getAllDivisionLeadersAndMembers = async () => {
  try {
    const [res, legalRes] = await Promise.all([
      fetchFromAPI("/users", { dcategory_gt: 0 }),
      fetchFromAPI("/users", { role: 3 }),
    ]);
    const users = res.data || [];
    const legalUsers = legalRes.data || [];
    const grouped = groupUsersByDivision(users);
    if (legalUsers.length > 0) {
      grouped[0] = { leader: null, members: legalUsers };
    }
    return grouped;
  } catch (e) {
    console.log(e, "============error in get all users from postgres============");
    return {};
  }
}

export const getAllDivisionLeaders = async () => {
  try {
    const res = await fetchFromAPI("/users", { role: 2 });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get all division leaders from postgres============");
    return [];
  }
}

export const getDivisionMembersByDivisionId = async (divisionId: number) => {
  try {
    const res = await fetchFromAPI("/users", { dcategory: divisionId, role: 1 });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get division members from postgres============");
    return [];
  }
}

export const getAllClients = async () => {
  try {
    const res = await fetchFromAPI("/users", { role: 5 });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get all clients from postgres============");
    return [];
  }
}

export const getAllContracts = async () => {
  try {
    const res = await fetchFromAPI("/documents-full");
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get all contracts from postgres============");
    return [];
  }
}

export const getContractsByClient = async (client: string) => {
  try {
    const res = await fetchFromAPI("/documents-full", { client });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get contracts by client from postgres============");
    return [];
  }
}

export const getContractById = async (id: string | number) => {
  try {
    const res = await fetchFromAPI(`/documents-full/${id}`);
    return res.data ?? null;
  } catch (e) {
    console.log(e, "============error in get contract by id from postgres============");
    return null;
  }
};

export const getSectionsByDivisionLeader = async (divisionLeaderId: string) => {
  try {
    const res = await fetchFromAPI("/sections-full", { divisionLeader: divisionLeaderId });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get sections by division leader from postgres============");
    return [];
  }
}

export const getClausesByDivisionMember = async (divisionMemberId: string) => {
  try {
    const res = await fetchFromAPI("/clauses-full", { divisionMember: divisionMemberId.toLowerCase() });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get clauses by division member from postgres============");
    return [];
  }
}

/** Fetch a single clause by its on-chain id; returns { id, cid } or null. Use clause id to get cid and then fetch content from gateway. */
export const getClauseById = async (clauseId: string): Promise<{ id: string; cid: string | null } | null> => {
  try {
    const res = await fetchFromAPI(`/clauses/${clauseId.toLowerCase()}`);
    return res.data ?? null;
  } catch (e) {
    console.log(e, "============error in getClauseById from postgres============");
    return null;
  }
};

export const getClauseHistories = async (clauseId: string) => {
  try {
    const res = await fetchFromAPI("/clause-histories", { clauseId });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get clause histories from postgres============");
    return [];
  }
}

export const getSectionHistories = async (sectionId: string) => {
  try {
    const res = await fetchFromAPI("/section-histories", { sectionId });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get section histories from postgres============");
    return [];
  }
}

export const getContractHistories = async (docId: string) => {
  try {
    const res = await fetchFromAPI("/doc-histories", { docId });
    return res.data || [];
  } catch (e) {
    console.log(e, "============error in get contract histories from postgres============");
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

