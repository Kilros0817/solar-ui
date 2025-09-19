export function seedActivitiesIfEmpty() {
  try {
    const existing = JSON.parse(localStorage.getItem("activities") || "null");
    if (Array.isArray(existing) && existing.length > 0) return;
    const now = Date.now();
    const mins = (m) => new Date(now - m * 60 * 1000).toISOString();
    const hours = (h) => new Date(now - h * 60 * 60 * 1000).toISOString();
    const days = (d) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

    const seed = [
      { id: crypto.randomUUID(), type: "created", action: "Contract created", contractTitle: "Solar PPA Q3", client: "Helios Corp", actor: "Alice Legal", at: mins(12) },
      { id: crypto.randomUUID(), type: "submitted", action: "Contract submitted", contractTitle: "Solar PPA Q3", client: "Helios Corp", actor: "Bob Legal", at: mins(8) },
      { id: crypto.randomUUID(), type: "approved", action: "Contract approved", contractTitle: "Maintenance SLA", client: "Acme Energy", actor: "Cara Leader", at: hours(2) },
      { id: crypto.randomUUID(), type: "requires_action", action: "Requires action", contractTitle: "Equipment Lease", client: "Photon Ltd", actor: "Dave Member", at: hours(5) },
      { id: crypto.randomUUID(), type: "comment", action: "Comment added", contractTitle: "Compliance Addendum", client: "Nova Grid", actor: "Alice Legal", at: hours(7) },
      { id: crypto.randomUUID(), type: "created", action: "Contract created", contractTitle: "Battery Storage Pilot", client: "Volt Dynamics", actor: "Bob Legal", at: days(1) },
      { id: crypto.randomUUID(), type: "submitted", action: "Contract submitted", contractTitle: "Battery Storage Pilot", client: "Volt Dynamics", actor: "Cara Leader", at: days(1) },
      { id: crypto.randomUUID(), type: "approved", action: "Contract approved", contractTitle: "Supplier NDA", client: "Terra Supply", actor: "Alice Legal", at: days(2) },
      { id: crypto.randomUUID(), type: "requires_action", action: "Requires action", contractTitle: "Grid Connection", client: "Northwind", actor: "Dave Member", at: days(3) },
      { id: crypto.randomUUID(), type: "comment", action: "Comment added", contractTitle: "Maintenance SLA", client: "Acme Energy", actor: "Alice Legal", at: days(4) },
    ];
    localStorage.setItem("activities", JSON.stringify(seed));
  } catch {
    // ignore
  }
}

export function getActivities(limit = 10) {
  try {
    const raw = JSON.parse(localStorage.getItem("activities") || "[]");
    const normalized = raw.map((it) => normalizeActivity(it));
    return normalized
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, limit);
  } catch {
    return [];
  }
}

function normalizeActivity(item) {
  const pickFromMessage = () => {
    if (!item?.message) return {};
    const titleMatch = item.message.match(/'([^']+)'/);
    const contractTitle = titleMatch ? titleMatch[1] : undefined;
    let action;
    if (/approved/i.test(item.message)) action = "Contract approved";
    else if (/submitted/i.test(item.message)) action = "Contract submitted";
    else if (/created/i.test(item.message)) action = "Contract created";
    else if (/requires action/i.test(item.message)) action = "Requires action";
    else if (/comment/i.test(item.message)) action = "Comment added";
    return { contractTitle, action };
  };

  const fromMsg = pickFromMessage();
  const action = item.action || fromMsg.action || "Activity";
  const contractTitle = item.contractTitle || fromMsg.contractTitle || "";
  const client = item.client || "";
  const actor = item.actor || "System";
  const type = item.type || "comment";
  const at = item.at || new Date().toISOString();
  return { id: item.id || crypto.randomUUID(), type, action, contractTitle, client, actor, at };
}

export function addActivity(entry) {
  try {
    const list = JSON.parse(localStorage.getItem("activities") || "[]");
    const withId = { id: crypto.randomUUID(), at: new Date().toISOString(), ...entry };
    list.push(withId);
    localStorage.setItem("activities", JSON.stringify(list));
    return withId;
  } catch {
    return null;
  }
}

export function seedDeadlinesIfEmpty() {
  try {
    const existing = JSON.parse(localStorage.getItem("deadlines") || "null");
    if (Array.isArray(existing) && existing.length > 0) return;
    
    const now = new Date();
    const addDays = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const addHours = (hours) => new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    const seed = [
      {
        id: crypto.randomUUID(),
        title: "Solar PPA Q3 Contract Review",
        client: "Helios Corp",
        type: "contract_review",
        dueDate: addDays(2).toISOString(),
        priority: "high",
        status: "pending"
      },
      {
        id: crypto.randomUUID(),
        title: "Equipment Lease Payment",
        client: "Photon Ltd",
        type: "payment",
        dueDate: addDays(5).toISOString(),
        priority: "critical",
        status: "pending"
      },
      {
        id: crypto.randomUUID(),
        title: "Compliance Documentation",
        client: "Nova Grid",
        type: "compliance",
        dueDate: addDays(7).toISOString(),
        priority: "high",
        status: "pending"
      },
      {
        id: crypto.randomUUID(),
        title: "Battery Storage Pilot Review",
        client: "Volt Dynamics",
        type: "project_review",
        dueDate: addDays(10).toISOString(),
        priority: "medium",
        status: "pending"
      },
      {
        id: crypto.randomUUID(),
        title: "Supplier NDA Renewal",
        client: "Terra Supply",
        type: "contract_renewal",
        dueDate: addDays(14).toISOString(),
        priority: "medium",
        status: "pending"
      },
      {
        id: crypto.randomUUID(),
        title: "Grid Connection Approval",
        client: "Northwind",
        type: "regulatory",
        dueDate: addDays(21).toISOString(),
        priority: "high",
        status: "pending"
      },
      {
        id: crypto.randomUUID(),
        title: "Maintenance SLA Update",
        client: "Acme Energy",
        type: "contract_update",
        dueDate: addDays(30).toISOString(),
        priority: "low",
        status: "pending"
      },
      {
        id: crypto.randomUUID(),
        title: "Quarterly Safety Inspection",
        client: "SolarTech Inc",
        type: "inspection",
        dueDate: addDays(45).toISOString(),
        priority: "high",
        status: "pending"
      }
    ];
    
    localStorage.setItem("deadlines", JSON.stringify(seed));
  } catch {
    // ignore
  }
}

export function getUpcomingDeadlines(limit = 5) {
  try {
    const raw = JSON.parse(localStorage.getItem("deadlines") || "[]");
    const now = new Date();
    
    return raw
      .filter(deadline => new Date(deadline.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function seedContractsIfEmpty() {
  try {
    const existing = JSON.parse(localStorage.getItem("contracts") || "null");
    if (Array.isArray(existing) && existing.length > 0) return;
    
    const now = new Date();
    const addDays = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const addHours = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    const seed = [
      {
        id: crypto.randomUUID(),
        title: "Solar PPA Q3 2024",
        client: "Helios Corp",
        priority: "Medium",
        status: "pending",
        createdAt: addDays(2).toISOString(),
        modifiedAt: addDays(1).toISOString(),
        dueDate: addDays(30).toISOString(),
        value: 2500000,
        duration: "15 years",
        type: "Power Purchase Agreement",
        version: "2.1"
      },
      {
        id: crypto.randomUUID(),
        title: "Maintenance SLA - Solar Farm Alpha",
        client: "Acme Energy",
        priority: "Low",
        status: "approved",
        createdAt: addDays(5).toISOString(),
        modifiedAt: addDays(3).toISOString(),
        dueDate: addDays(60).toISOString(),
        value: 180000,
        duration: "3 years",
        type: "Service Level Agreement",
        version: "1.3"
      },
      {
        id: crypto.randomUUID(),
        title: "Equipment Lease Agreement",
        client: "Photon Ltd",
        priority: "High",
        status: "requires_action",
        createdAt: addDays(1).toISOString(),
        modifiedAt: addHours(12).toISOString(),
        dueDate: addDays(7).toISOString(),
        value: 450000,
        duration: "5 years",
        type: "Equipment Lease",
        version: "3.0"
      },
      {
        id: crypto.randomUUID(),
        title: "Compliance Addendum - Grid Connection",
        client: "Nova Grid",
        priority: "Critical",
        status: "requires_action",
        createdAt: addHours(8).toISOString(),
        modifiedAt: addHours(2).toISOString(),
        dueDate: addDays(3).toISOString(),
        value: 75000,
        duration: "1 year",
        type: "Regulatory Compliance",
        version: "1.8"
      },
      {
        id: crypto.randomUUID(),
        title: "Battery Storage Pilot Project",
        client: "Volt Dynamics",
        priority: "Medium",
        status: "pending",
        createdAt: addDays(3).toISOString(),
        modifiedAt: addDays(2).toISOString(),
        dueDate: addDays(45).toISOString(),
        value: 3200000,
        duration: "2 years",
        type: "Research & Development",
        version: "1.5"
      },
      {
        id: crypto.randomUUID(),
        title: "Supplier NDA - Terra Supply",
        client: "Terra Supply",
        priority: "Low",
        status: "approved",
        createdAt: addDays(7).toISOString(),
        modifiedAt: addDays(5).toISOString(),
        dueDate: addDays(90).toISOString(),
        value: 0,
        duration: "2 years",
        type: "Non-Disclosure Agreement",
        version: "1.0"
      },
      {
        id: crypto.randomUUID(),
        title: "Grid Connection Agreement",
        client: "Northwind Energy",
        priority: "High",
        status: "requires_action",
        createdAt: addDays(4).toISOString(),
        modifiedAt: addDays(1).toISOString(),
        dueDate: addDays(14).toISOString(),
        value: 125000,
        duration: "10 years",
        type: "Grid Connection",
        version: "2.2"
      },
      {
        id: crypto.randomUUID(),
        title: "Maintenance SLA - Solar Farm Beta",
        client: "Acme Energy",
        priority: "Low",
        status: "approved",
        createdAt: addDays(10).toISOString(),
        modifiedAt: addDays(8).toISOString(),
        dueDate: addDays(75).toISOString(),
        value: 220000,
        duration: "3 years",
        type: "Service Level Agreement",
        version: "1.2"
      },
      {
        id: crypto.randomUUID(),
        title: "Insurance Coverage Extension",
        client: "SolarTech Inc",
        priority: "Medium",
        status: "pending",
        createdAt: addDays(6).toISOString(),
        modifiedAt: addDays(4).toISOString(),
        dueDate: addDays(21).toISOString(),
        value: 95000,
        duration: "1 year",
        type: "Insurance",
        version: "1.1"
      },
      {
        id: crypto.randomUUID(),
        title: "Environmental Impact Assessment",
        client: "Green Valley Solar",
        priority: "High",
        status: "requires_action",
        createdAt: addDays(8).toISOString(),
        modifiedAt: addDays(6).toISOString(),
        dueDate: addDays(10).toISOString(),
        value: 150000,
        duration: "6 months",
        type: "Environmental Compliance",
        version: "2.0"
      },
      {
        id: crypto.randomUUID(),
        title: "Technology Transfer Agreement",
        client: "Innovate Solar",
        priority: "Medium",
        status: "pending",
        createdAt: addDays(12).toISOString(),
        modifiedAt: addDays(10).toISOString(),
        dueDate: addDays(35).toISOString(),
        value: 800000,
        duration: "4 years",
        type: "Technology Transfer",
        version: "1.7"
      },
      {
        id: crypto.randomUUID(),
        title: "Safety Protocol Update",
        client: "SolarTech Inc",
        priority: "Low",
        status: "approved",
        createdAt: addDays(15).toISOString(),
        modifiedAt: addDays(12).toISOString(),
        dueDate: addDays(120).toISOString(),
        value: 25000,
        duration: "1 year",
        type: "Safety Compliance",
        version: "1.4"
      },
      {
        id: crypto.randomUUID(),
        title: "Performance Guarantee - Wind Farm",
        client: "WindPower Solutions",
        priority: "Critical",
        status: "requires_action",
        createdAt: addDays(9).toISOString(),
        modifiedAt: addDays(7).toISOString(),
        dueDate: addDays(5).toISOString(),
        value: 5000000,
        duration: "20 years",
        type: "Performance Guarantee",
        version: "3.5"
      },
      {
        id: crypto.randomUUID(),
        title: "Software License Renewal",
        client: "SolarSoft Systems",
        priority: "Medium",
        status: "pending",
        createdAt: addDays(11).toISOString(),
        modifiedAt: addDays(9).toISOString(),
        dueDate: addDays(25).toISOString(),
        value: 120000,
        duration: "2 years",
        type: "Software License",
        version: "2.3"
      },
      {
        id: crypto.randomUUID(),
        title: "Emergency Response Protocol",
        client: "Safety First Solar",
        priority: "High",
        status: "requires_action",
        createdAt: addDays(13).toISOString(),
        modifiedAt: addDays(11).toISOString(),
        dueDate: addDays(8).toISOString(),
        value: 75000,
        duration: "1 year",
        type: "Emergency Response",
        version: "1.9"
      },
      {
        id: crypto.randomUUID(),
        title: "Legacy Solar Installation - Phase 1",
        client: "Old Energy Corp",
        priority: "Low",
        status: "archived",
        createdAt: addDays(30).toISOString(),
        modifiedAt: addDays(25).toISOString(),
        dueDate: addDays(365).toISOString(),
        value: 1200000,
        duration: "10 years",
        type: "Power Purchase Agreement",
        version: "1.0"
      },
      {
        id: crypto.randomUUID(),
        title: "Expired Maintenance Contract",
        client: "Sunshine Solar",
        priority: "Low",
        status: "archived",
        createdAt: addDays(45).toISOString(),
        modifiedAt: addDays(40).toISOString(),
        dueDate: addDays(30).toISOString(),
        value: 85000,
        duration: "2 years",
        type: "Service Level Agreement",
        version: "2.1"
      },
      {
        id: crypto.randomUUID(),
        title: "Cancelled Wind Farm Project",
        client: "WindPower Solutions",
        priority: "Medium",
        status: "archived",
        createdAt: addDays(60).toISOString(),
        modifiedAt: addDays(55).toISOString(),
        dueDate: addDays(30).toISOString(),
        value: 0,
        duration: "5 years",
        type: "Project Development",
        version: "1.2"
      }
    ];
    
    localStorage.setItem("contracts", JSON.stringify(seed));
  } catch {
    // ignore
  }
}


