export type CompanyMetric = {
  id: string;
  value: string;
  label: string;
};

export type CompanyAboutSection = {
  id: string;
  title: string;
  content: string;
  image: string;
};

export type CompanyService = {
  id: string;
  title: string;
  href: string;
  description: string;
  image: string;
};

export type EnquiryField = {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "tel" | "textarea";
  required: boolean;
};

export type CompanyCustomTabField = {
  id: string;
  type: "heading" | "text" | "image" | "service";
  content: string;
  title?: string;
  href?: string;
  description?: string;
  image?: string;
};

export type CompanyCustomTab = {
  id: string;
  title: string;
  fields: CompanyCustomTabField[];
};

export function getCompanyCustomTabFieldContent(field: CompanyCustomTabField) {
  return {
    heading: field.type === "heading" ? field.content : field.title ?? "",
    description: field.type === "text" ? field.content : field.description ?? "",
    image: field.type === "image" ? field.content : field.image ?? "",
  };
}

export type CompanyPreviewSettings = {
  whatsappMessage: string;
  labels: {
    call: string;
    addContact: string;
    whatsapp: string;
    email: string;
    share: string;
    shareDialogTitle?: string;
    previous: string;
    next: string;
    footer: string;
  };
  tabs: {
    about: string;
    services: string;
    enquiry: string;
  };
  tabOrder?: string[];
  hiddenTabs?: string[];
  customTabs?: CompanyCustomTab[];
  cardServicesOverride?: boolean;
  about: {
    kicker: string;
    title: string;
    description: string;
    visionTitle: string;
    vision: string;
    missionTitle: string;
    mission: string;
    metrics: CompanyMetric[];
    sections: CompanyAboutSection[];
  };
  services: {
    enabled?: boolean;
    title: string;
    moreLabel: string;
    moreLink: string;
    items: CompanyService[];
  };
  enquiry: {
    title: string;
    description: string;
    submitLabel: string;
    fields: EnquiryField[];
  };
};

export const DEFAULT_COMPANY_PREVIEW: CompanyPreviewSettings = {
  whatsappMessage: "Hi {name},\n\nI came across your digital visiting card and would like to connect with you. Looking forward to speaking with you.",
  labels: {
    call: "Call",
    addContact: "Contact",
    whatsapp: "WhatsApp",
    email: "Email",
    share: "Share",
    shareDialogTitle: "Share this contact",
    previous: "Previous",
    next: "Next",
    footer: "Digital contact card · Powered by Card Reader",
  },
  tabs: {
    about: "About Us",
    services: "Services",
    enquiry: "Enquiry",
  },
  tabOrder: ["about", "services", "enquiry"],
  hiddenTabs: [],
  customTabs: [],
  about: {
    kicker: "Company profile",
    title: "Brihaspathi Technologies",
    description: "An AI-powered mission-critical technology company with capabilities spanning proprietary product engineering, electronics manufacturing, software platforms, AI video intelligence and nationwide project execution.",
    visionTitle: "Our vision",
    vision: "To become one of the India’s leading AI-powered mission-critical technology companies with global relevance.",
    missionTitle: "Our mission",
    mission: "To build an AI-powered mission-critical technology enterprise combining the proprietary hardware, software, AI platforms, electronics manufacturing and managed services for Defence, Public Safety, Railways, Mobility and Critical Infrastructure.",
    metrics: [
      { id: "metric-years", value: "15+", label: "Years of excellence" },
      { id: "metric-cameras", value: "2M+", label: "Cameras deployed" },
      { id: "metric-clients", value: "15k+", label: "Clients" },
      { id: "metric-professionals", value: "400+", label: "Professionals" },
    ],
    sections: [],
  },
  services: {
    enabled: true,
    title: "Our services",
    moreLabel: "More",
    moreLink: "https://brihaspathi.com/",
    items: [
      {
        id: "service-smart-bus",
        title: "Smart Bus Solutions",
        href: "https://brihaspathi.com/services/smart-bus-solutions",
        description: "Our smart bus systems combine AI CCTV, GPS tracking, Wi-Fi, displays, breath analysis, and analytics for public transport. Real-time monitoring supports passenger safety and fleet oversight, while route insights help operators improve service efficiency. Optional features include pedestrian blind-spot detection and driver fatigue monitoring.",
        image: "/services/smart-bus-solutions.jpeg",
      },
      {
        id: "service-solar",
        title: "Sustainable Energy Revolution: Solar EPC Excellence",
        href: "https://brihaspathi.com/solutions/solar-epc",
        description: "Our Solar EPC service delivers turnkey solar power projects for residential, commercial, and industrial clients. We manage site assessments, engineering and system design, procurement of quality components, construction, grid integration, testing, and commissioning. Quality checks and project management help ensure reliable performance, streamlined delivery, and lasting renewable energy benefits.",
        image: "/services/solar-epc.jpg",
      },
      {
        id: "service-software",
        title: "Software Products & Services",
        href: "https://brihaspathi.com/services/software-products-services",
        description: "We develop software for communication, automation, and business management, including web and app development, IoT applications, E-Communication, and ERP systems. Solutions such as Biz Track ERP help streamline operations, support customer engagement, and provide insights for growing businesses.",
        image: "/services/software-products-services.jpeg",
      },
      {
        id: "service-hrms",
        title: "HRMS",
        href: "https://brihaspathi.com/product/hrms",
        description: "Brihaspathi's HRMS centralizes employee records and supports recruitment, onboarding, attendance, leave, payroll, performance, and document management. Workflow automation, biometric integration, notifications, dashboards, and employee self-service help HR teams streamline everyday processes and maintain visibility across the employee lifecycle.",
        image: "/services/hrms.jpg",
      },
      {
        id: "service-visitor-management",
        title: "AI Visitor Management System",
        href: "https://brihaspathi.com/product/ai-visitor-management-system",
        description: "Improve facility security with AI facial recognition, visitor identification, and multi-camera tracking. The system supports digital registration, QR visitor passes, and approval workflows, while a centralized dashboard helps security teams monitor visitor activity, movement, alerts, and events across the premises.",
        image: "/services/ai-visitor-management.png",
      },
      {
        id: "service-command-centre",
        title: "Command & Control Centre Engineering",
        href: "https://brihaspathi.com/services/command-control-centre-engineering",
        description: "We design and build Integrated Command & Control Centres (ICCCs) with video walls, operator consoles, monitoring platforms, and backend infrastructure. These integrated environments give teams real-time visibility to coordinate operations, monitor incidents, and make informed decisions across connected systems.",
        image: "/services/command-control.jpeg",
      },
    ],
  },
  enquiry: {
    title: "Enquiry Form",
    description: "",
    submitLabel: "Send",
    fields: [
      { id: "name", label: "Name", placeholder: "Name", type: "text", required: true },
      { id: "email", label: "Email", placeholder: "Email", type: "email", required: true },
      { id: "phone", label: "Mobile", placeholder: "Mobile", type: "tel", required: false },
      { id: "message", label: "Message", placeholder: "Type your message", type: "textarea", required: true },
    ],
  },
};

export function createDefaultCompanyPreview(companyName: string): CompanyPreviewSettings {
  return {
    ...DEFAULT_COMPANY_PREVIEW,
    about: {
      ...DEFAULT_COMPANY_PREVIEW.about,
      title: companyName,
      description: "",
      vision: "",
      mission: "",
      metrics: [],
      sections: [],
    },
    services: {
      ...DEFAULT_COMPANY_PREVIEW.services,
      moreLink: "",
      items: [],
    },
  };
}

export function mergeCardPreviewWithCompanyDefaults(
  companyPreview: CompanyPreviewSettings,
  cardPreview?: CompanyPreviewSettings
): CompanyPreviewSettings {
  if (!cardPreview) return companyPreview;
  const defaultServiceIds = new Set(companyPreview.services.items.map((service) => service.id));
  const cardServices = cardPreview.services.items.filter((service) => !defaultServiceIds.has(service.id));
  return {
    ...companyPreview,
    ...cardPreview,
    tabs: {
      ...companyPreview.tabs,
      ...cardPreview.tabs,
    },
    hiddenTabs: cardPreview.hiddenTabs ?? companyPreview.hiddenTabs,
    services: cardPreview.cardServicesOverride
      ? cardPreview.services
      : {
          ...companyPreview.services,
          items: [...companyPreview.services.items, ...cardServices],
        },
  };
}

export function getCompanyPreviewTabOrder(preview: CompanyPreviewSettings): string[] {
  const knownIds = ["about", "services", "enquiry", ...(preview.customTabs ?? []).map((tab) => tab.id)];
  const configuredIds = (preview.tabOrder ?? []).filter((id, index, ids) =>
    knownIds.includes(id) && ids.indexOf(id) === index
  );
  return [...configuredIds, ...knownIds.filter((id) => !configuredIds.includes(id))];
}

export function isCompanyPreviewTabHidden(preview: CompanyPreviewSettings, tabId: string): boolean {
  return (preview.hiddenTabs ?? []).includes(tabId) ||
    (tabId === "services" && preview.services.enabled === false);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.length <= maxLength;
}

function isImageSource(value: unknown) {
  if (typeof value !== "string" || value.length > 700_000) return false;
  if (!value) return true;
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  if (/^\/(?!\/)[\w./-]+$/.test(value) && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isOptionalText(value: unknown, maxLength: number) {
  return value === undefined || isText(value, maxLength);
}

function isOptionalImageSource(value: unknown) {
  return value === undefined || isImageSource(value);
}

function isLink(value: unknown) {
  if (value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function isCompanyPreviewSettings(value: unknown): value is CompanyPreviewSettings {
  if (!isRecord(value) || !isRecord(value.labels) || !isRecord(value.tabs) || !isRecord(value.about) || !isRecord(value.services) || !isRecord(value.enquiry)) return false;
  if (value.cardServicesOverride !== undefined && typeof value.cardServicesOverride !== "boolean") return false;
  const customTabs = value.customTabs;
  if (customTabs !== undefined && (
    !Array.isArray(customTabs) ||
    customTabs.length > 50 ||
    !customTabs.every((tab) =>
      isRecord(tab) &&
      /^[\w-]{1,100}$/.test(typeof tab.id === "string" ? tab.id : "") &&
      isText(tab.title, 100) &&
      Array.isArray(tab.fields) &&
      tab.fields.length <= 100 &&
      tab.fields.every((field) =>
        isRecord(field) &&
        /^[\w-]{1,100}$/.test(typeof field.id === "string" ? field.id : "") &&
        (field.type === "heading" || field.type === "text" || field.type === "image" || field.type === "service") &&
        isOptionalText(field.title, 200) &&
        isOptionalText(field.description, 10_000) &&
        isOptionalText(field.href, 2048) &&
        isOptionalImageSource(field.image) &&
        (field.type === "heading" ? isText(field.content, 200) :
          field.type === "text" ? isText(field.content, 10_000) :
            field.type === "image" ? isImageSource(field.content) :
              (field.content === undefined || isText(field.content, 10_000)) &&
              isOptionalText(field.title, 200) &&
              isOptionalText(field.href, 2048) &&
              isLink(typeof field.href === "string" ? field.href : "") &&
              isOptionalText(field.description, 10_000) &&
              isOptionalImageSource(field.image))
      ) &&
      new Set(tab.fields.map((field) => isRecord(field) ? field.id : "")).size === tab.fields.length
    )
  )) return false;
  const normalizedCustomTabs = Array.isArray(customTabs) ? customTabs : [];
  const customTabIds = normalizedCustomTabs.map((tab) => isRecord(tab) ? String(tab.id) : "");
  if (
    new Set(customTabIds).size !== normalizedCustomTabs.length ||
    customTabIds.some((id) => id === "about" || id === "services" || id === "enquiry")
  ) return false;
  const knownTabIds = ["about", "services", "enquiry", ...customTabIds];
  if (value.tabOrder !== undefined) {
    if (
      !Array.isArray(value.tabOrder) ||
      value.tabOrder.length !== knownTabIds.length ||
      !value.tabOrder.every((id) => typeof id === "string" && knownTabIds.includes(id)) ||
      new Set(value.tabOrder).size !== value.tabOrder.length
    ) return false;
  }
  if (value.hiddenTabs !== undefined && (
    !Array.isArray(value.hiddenTabs) ||
    value.hiddenTabs.length > knownTabIds.length ||
    !value.hiddenTabs.every((id) => typeof id === "string" && knownTabIds.includes(id)) ||
    new Set(value.hiddenTabs).size !== value.hiddenTabs.length
  )) return false;
  if (
    !isText(value.whatsappMessage, 2000) ||
    !isText(value.labels.call, 100) ||
    !isText(value.labels.addContact, 100) ||
    !isText(value.labels.whatsapp, 100) ||
    !isText(value.labels.email, 100) ||
    !isText(value.labels.share, 100) ||
    (value.labels.shareDialogTitle !== undefined && !isText(value.labels.shareDialogTitle, 100)) ||
    !isText(value.labels.previous, 100) ||
    !isText(value.labels.next, 100) ||
    !isText(value.labels.footer, 200)
  ) return false;
  if (!isText(value.tabs.about, 100) || !isText(value.tabs.services, 100) || !isText(value.tabs.enquiry, 100)) return false;
  const about = value.about;
  if (
    !isText(about.title, 200) ||
    !isText(about.kicker, 200) ||
    !isText(about.description, 10_000) ||
    !isText(about.visionTitle, 200) ||
    !isText(about.vision, 10_000) ||
    !isText(about.missionTitle, 200) ||
    !isText(about.mission, 10_000) ||
    !Array.isArray(about.metrics) ||
    about.metrics.length > 100 ||
    !about.metrics.every((metric) => isRecord(metric) && isText(metric.id, 100) && isText(metric.value, 200) && isText(metric.label, 200)) ||
    new Set(about.metrics.map((metric) => isRecord(metric) ? metric.id : "")).size !== about.metrics.length ||
    !Array.isArray(about.sections) ||
    about.sections.length > 100 ||
    !about.sections.every((section) => isRecord(section) && isText(section.id, 100) && isText(section.title, 200) && isText(section.content, 10_000) && isImageSource(section.image))
  ) return false;
  if (new Set(about.sections.map((section) => isRecord(section) ? section.id : "")).size !== about.sections.length) return false;

  const services = value.services;
  if (
    (services.enabled !== undefined && typeof services.enabled !== "boolean") ||
    !isText(services.title, 200) ||
    !isText(services.moreLabel, 100) ||
    !isLink(services.moreLink) ||
    !Array.isArray(services.items) ||
    services.items.length > 100 ||
    !services.items.every((service) =>
      isRecord(service) &&
      isText(service.id, 100) &&
      isText(service.title, 200) &&
      isLink(service.href) &&
      isText(service.description, 10_000) &&
      isImageSource(service.image)
    )
  ) return false;
  if (new Set(services.items.map((service) => isRecord(service) ? service.id : "")).size !== services.items.length) return false;

  const enquiry = value.enquiry;
  return (
    isText(enquiry.title, 200) &&
    isText(enquiry.description, 2_000) &&
    isText(enquiry.submitLabel, 100) &&
    Array.isArray(enquiry.fields) &&
    enquiry.fields.length <= 50 &&
    enquiry.fields.every((field) =>
      isRecord(field) &&
      /^[\w-]{1,100}$/.test(typeof field.id === "string" ? field.id : "") &&
      isText(field.label, 200) &&
      isText(field.placeholder, 200) &&
      (field.type === "text" || field.type === "email" || field.type === "tel" || field.type === "textarea") &&
      typeof field.required === "boolean"
    )
    && new Set(enquiry.fields.map((field) => isRecord(field) ? field.id : "")).size === enquiry.fields.length
  );
}

export function normalizeCompanyPreviewSettings(value: unknown): CompanyPreviewSettings | undefined {
  if (!isRecord(value)) return undefined;
  const tabs = isRecord(value.tabs) ? value.tabs : {};
  const about = isRecord(value.about) ? value.about : {};
  const services = isRecord(value.services) ? value.services : {};
  const enquiry = isRecord(value.enquiry) ? value.enquiry : {};
  const customTabs = value.customTabs ?? DEFAULT_COMPANY_PREVIEW.customTabs;
  const customTabIds = Array.isArray(customTabs)
    ? customTabs.filter(isRecord).map((tab) => typeof tab.id === "string" ? tab.id : "")
    : [];
  const tabOrder = value.tabOrder ?? ["about", "services", "enquiry", ...customTabIds];
  const normalized = {
    ...DEFAULT_COMPANY_PREVIEW,
    ...value,
    tabs: { ...DEFAULT_COMPANY_PREVIEW.tabs, ...tabs },
    tabOrder,
    hiddenTabs: value.hiddenTabs ?? DEFAULT_COMPANY_PREVIEW.hiddenTabs,
    customTabs,
    about: { ...DEFAULT_COMPANY_PREVIEW.about, ...about },
    services: { ...DEFAULT_COMPANY_PREVIEW.services, ...services },
    enquiry: { ...DEFAULT_COMPANY_PREVIEW.enquiry, ...enquiry },
    labels: {
      ...DEFAULT_COMPANY_PREVIEW.labels,
      ...(isRecord(value.labels) ? value.labels : {}),
    },
  };
  return isCompanyPreviewSettings(normalized) ? normalized : undefined;
}
