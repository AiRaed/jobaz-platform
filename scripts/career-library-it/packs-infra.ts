/**
 * IT Career Knowledge Library — Infrastructure & Operations specialism packs.
 * Experience-level stage model (entry → director). ~28 UK-realistic roles each.
 */

import { r, type SpecialismPack } from './shared'

const INFRA_FAMILY = [
  'devops',
  'cloud-computing',
  'cyber-security',
  'networking',
  'systems-administration',
  'it-support',
  'database-administration',
] as const

function infraSiblings(slug: (typeof INFRA_FAMILY)[number]): string[] {
  return INFRA_FAMILY.filter((s) => s !== slug)
}

const DEVOPS_BOUNDARY =
  'DevOps focuses on CI/CD pipelines, platform automation and site reliability — not pure cloud solution design (Cloud Computing), packet routing and LAN/WAN engineering (Networking), OS/server patching (Systems Administration), first-line user helpdesk (IT Support), SOC/threat work (Cyber Security), or database tuning (Database Administration).'

const CLOUD_BOUNDARY =
  'Cloud Computing focuses on public/hybrid cloud platforms and cloud-native architecture — not pipeline automation ownership (DevOps), on-prem network design (Networking), endpoint helpdesk (IT Support), SOC operations (Cyber Security), bare-metal server admin (Systems Administration), or RDBMS platform work (Database Administration).'

const CYBER_BOUNDARY =
  'Cyber Security focuses on threat detection, security controls and assurance — not general cloud provisioning (Cloud Computing), CI/CD platform engineering (DevOps), routing/switching design (Networking), desktop/server OS support (Systems Administration), ITIL service desk (IT Support), or database performance administration (Database Administration).'

const NETWORK_BOUNDARY =
  'Networking focuses on LAN/WAN, routing, switching and network operations — not application CI/CD (DevOps), cloud landing zones (Cloud Computing), vulnerability management programmes (Cyber Security), Windows/Linux server admin (Systems Administration), user device support (IT Support), or SQL/Oracle DBA work (Database Administration).'

const SYSADMIN_BOUNDARY =
  'Systems Administration focuses on server OS, virtualisation and on-prem infrastructure — not cloud-native platform engineering (Cloud Computing), release pipeline automation (DevOps), firewall/SOC work (Cyber Security), Cisco routing design (Networking), first-line helpdesk (IT Support), or database engine administration (Database Administration).'

const IT_SUPPORT_BOUNDARY =
  'IT Support focuses on end-user service desk, desktop and field support under ITIL practices — not cloud architecture (Cloud Computing), DevOps/SRE automation (DevOps), penetration testing (Cyber Security), network engineering (Networking), enterprise server administration (Systems Administration), or database platform roles (Database Administration).'

const DBA_BOUNDARY =
  'Database Administration focuses on RDBMS platforms, backup/recovery and query performance — not CI/CD pipelines (DevOps), cloud IaaS/PaaS design (Cloud Computing), SOC analysis (Cyber Security), network routing (Networking), general server OS admin (Systems Administration), or helpdesk end-user support (IT Support).'

export const INFRA_PACKS: SpecialismPack[] = [
  {
    slug: 'devops',
    label: 'DevOps',
    professionalBody: 'British Computer Society (BCS)',
    relatedBodies: ['DevOps Institute', 'Linux Foundation', 'AWS', 'Microsoft Azure'],
    sources: [
      'BCS SFIA DevOps skills framework',
      'AWS DevOps Engineer Professional',
      'Azure DevOps Engineer Expert',
      'UK DevOps job market (LinkedIn, Reed, CWJobs)',
    ],
    siblingSlugs: infraSiblings('devops'),
    roles: [
      r(
        'DevOps Apprentice',
        'entry_trainee',
        'Structured apprenticeship supporting build pipelines, basic scripting and deployment tooling under supervision; CompTIA Linux+ or cloud fundamentals often encouraged.',
        { priority: 10, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Graduate DevOps Engineer',
        'entry_trainee',
        'Graduate scheme role learning CI/CD, container basics and infrastructure-as-code on UK digital teams; degrees optional, portfolio and certs valued.',
        { priority: 20, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Junior Platform Operations Trainee',
        'entry_trainee',
        'Entry trainee on internal platform teams monitoring deployments, runbooks and on-call shadowing; AWS Cloud Practitioner or Azure Fundamentals common starters.',
        { priority: 30, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Release Engineering Trainee',
        'entry_trainee',
        'Supports build agents, artefact repositories and release notes for software delivery teams; Git and basic YAML pipeline exposure expected.',
        { priority: 40, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Junior DevOps Engineer',
        'junior',
        'Maintains CI/CD pipelines, container images and deployment scripts with senior review; Terraform or Ansible basics typical.',
        { priority: 50, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Junior Site Reliability Engineer',
        'junior',
        'Monitors service SLIs/SLOs, incident response and automation of toil under SRE team guidance; observability tooling experience building.',
        { priority: 60, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Junior Build and Release Engineer',
        'junior',
        'Owns build definitions, versioning and release coordination for application squads; Jenkins, GitHub Actions or Azure DevOps exposure.',
        { priority: 70, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Junior Automation Engineer (DevOps)',
        'junior',
        'Writes scripts and IaC modules to automate provisioning and configuration; Python, Bash or PowerShell used daily.',
        { priority: 80, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'DevOps Engineer',
        'practitioner',
        'Delivers end-to-end CI/CD, container orchestration and environment promotion across dev/test/prod; Kubernetes and IaC standard.',
        { priority: 90, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Site Reliability Engineer',
        'practitioner',
        'Balances reliability, performance and developer velocity through error budgets, runbooks and blameless post-mortems.',
        { priority: 100, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Platform Engineer',
        'practitioner',
        'Builds internal developer platforms, golden paths and self-service tooling for engineering teams; GitOps patterns common.',
        { priority: 110, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Build and Release Engineer',
        'practitioner',
        'Manages release trains, artefact promotion and deployment gates for enterprise software portfolios.',
        { priority: 120, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Senior DevOps Engineer',
        'senior',
        'Leads complex pipeline modernisation, multi-environment strategies and mentoring; AWS DevOps Pro or Azure DevOps Expert valued.',
        { priority: 130, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Senior Site Reliability Engineer',
        'senior',
        'Owns critical service reliability, capacity planning and incident command for high-traffic UK platforms.',
        { priority: 140, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Senior Platform Engineer',
        'senior',
        'Designs scalable internal platforms integrating identity, secrets and observability for hundreds of developers.',
        { priority: 150, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Senior Release Manager (DevOps)',
        'senior',
        'Coordinates enterprise release calendars, change advisory and rollback strategies across multiple product lines.',
        { priority: 160, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Lead DevOps Engineer',
        'lead_principal',
        'Technical lead for DevOps squads setting standards for IaC, pipeline security and deployment automation.',
        { priority: 170, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Lead Site Reliability Engineer',
        'lead_principal',
        'Leads SRE practice adoption, error-budget policy and on-call rotation design for platform estates.',
        { priority: 180, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'DevOps Technical Lead',
        'lead_principal',
        'Drives technical direction for automation tooling, container strategy and developer experience improvements.',
        { priority: 190, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'DevOps Architect',
        'architect_specialist',
        'Defines enterprise CI/CD reference architectures, toolchain selection and deployment topology across hybrid estates.',
        { priority: 200, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Platform Engineering Architect',
        'architect_specialist',
        'Architects internal developer platforms, service catalogues and golden-path templates for UK engineering organisations.',
        { priority: 210, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'CI/CD Pipeline Architect',
        'architect_specialist',
        'Designs secure, compliant pipeline patterns integrating SAST/DAST, secrets management and progressive delivery.',
        { priority: 220, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'DevOps Engineering Manager',
        'manager_head',
        'Manages DevOps engineers, hiring, performance and delivery of platform automation roadmaps.',
        { priority: 230, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Platform Engineering Manager',
        'manager_head',
        'Leads platform engineering teams building self-service infrastructure for product development.',
        { priority: 240, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'SRE Manager',
        'manager_head',
        'Oversees site reliability teams, incident management maturity and reliability KPIs for critical services.',
        { priority: 250, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Head of DevOps',
        'director_executive',
        'Senior leadership of DevOps function, budget, vendor strategy and alignment with engineering leadership.',
        { priority: 260, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Director of Platform Engineering',
        'director_executive',
        'Directs enterprise platform engineering, developer productivity and cloud-native delivery capabilities.',
        { priority: 270, eligibilityNote: DEVOPS_BOUNDARY }
      ),
      r(
        'Director of Engineering Operations',
        'director_executive',
        'Executive oversight of release engineering, SRE and operational excellence across technology portfolios.',
        { priority: 280, eligibilityNote: DEVOPS_BOUNDARY }
      ),
    ],
  },
  {
    slug: 'cloud-computing',
    label: 'Cloud Computing',
    professionalBody: 'British Computer Society (BCS)',
    relatedBodies: ['AWS', 'Microsoft Azure', 'Google Cloud', 'Cloud Security Alliance'],
    sources: [
      'BCS cloud computing skills framework',
      'AWS Solutions Architect Associate/Professional',
      'Microsoft Azure Administrator / Solutions Architect',
      'UK cloud engineering roles (LinkedIn, Reed)',
    ],
    siblingSlugs: infraSiblings('cloud-computing'),
    roles: [
      r(
        'Cloud Computing Apprentice',
        'entry_trainee',
        'Apprenticeship learning cloud fundamentals, console navigation and basic resource provisioning; AWS Cloud Practitioner or Azure Fundamentals typical.',
        { priority: 10, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Graduate Cloud Engineer',
        'entry_trainee',
        'Graduate role deploying and monitoring cloud workloads on AWS, Azure or GCP; degree optional, certifications strongly valued.',
        { priority: 20, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Junior Cloud Support Associate',
        'entry_trainee',
        'First-line cloud platform support triaging tickets, access requests and basic resource troubleshooting.',
        { priority: 30, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Cloud Operations Trainee',
        'entry_trainee',
        'Trainee supporting cloud cost tagging, backup policies and environment lifecycle under cloud ops team.',
        { priority: 40, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Junior Cloud Engineer',
        'junior',
        'Provisions VMs, storage, networking and managed services in cloud tenants with IaC templates.',
        { priority: 50, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Junior AWS Cloud Engineer',
        'junior',
        'Builds and maintains AWS workloads — EC2, S3, IAM, VPC — with Terraform or CloudFormation guidance.',
        { priority: 60, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Junior Azure Cloud Engineer',
        'junior',
        'Supports Azure subscriptions, resource groups, VMs and Azure AD integration for UK enterprise clients.',
        { priority: 70, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Junior GCP Cloud Engineer',
        'junior',
        'Assists with Google Cloud projects, GKE clusters and cloud storage for data and application teams.',
        { priority: 80, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Cloud Engineer',
        'practitioner',
        'Independent delivery of cloud migrations, landing zones and workload hardening across hybrid environments.',
        { priority: 90, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'AWS Cloud Engineer',
        'practitioner',
        'Designs and operates AWS-native solutions including Lambda, RDS and CloudWatch for production estates.',
        { priority: 100, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Azure Cloud Engineer',
        'practitioner',
        'Implements Azure infrastructure, PaaS services and hybrid connectivity for UK public and private sector.',
        { priority: 110, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Multi-Cloud Engineer',
        'practitioner',
        'Works across AWS, Azure and GCP enforcing consistent governance, networking and identity patterns.',
        { priority: 120, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Senior Cloud Engineer',
        'senior',
        'Leads complex cloud migrations, disaster recovery design and FinOps optimisation programmes.',
        { priority: 130, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Senior Cloud Solutions Engineer',
        'senior',
        'Translates business requirements into cloud reference designs integrating security and compliance controls.',
        { priority: 140, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Senior Cloud Infrastructure Engineer',
        'senior',
        'Owns cloud networking, hub-spoke topologies and hybrid DNS/connectivity for enterprise estates.',
        { priority: 150, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Senior Cloud Security Engineer',
        'senior',
        'Implements cloud security posture management, IAM least-privilege and encryption standards — cloud platform focus, not SOC operations.',
        { priority: 160, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Lead Cloud Engineer',
        'lead_principal',
        'Technical lead for cloud engineering squads defining standards for IaC modules and landing zones.',
        { priority: 170, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Cloud Infrastructure Lead',
        'lead_principal',
        'Leads cloud infrastructure workstreams across accounts, regions and environment tiers.',
        { priority: 180, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Cloud Platform Lead',
        'lead_principal',
        'Drives cloud platform roadmap, service catalogue and enablement for internal product teams.',
        { priority: 190, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Cloud Architect',
        'architect_specialist',
        'Designs enterprise cloud target architectures, migration waves and cloud-native application patterns.',
        { priority: 200, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'AWS Solutions Architect',
        'architect_specialist',
        'Authoritative AWS solution design across Well-Architected pillars; Professional certification expected.',
        { priority: 210, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Azure Solutions Architect',
        'architect_specialist',
        'Designs Azure enterprise architectures integrating Entra ID, landing zones and PaaS services.',
        { priority: 220, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Cloud Engineering Manager',
        'manager_head',
        'Manages cloud engineering teams, cloud centre of excellence initiatives and vendor relationships.',
        { priority: 230, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Cloud Infrastructure Manager',
        'manager_head',
        'Oversees cloud infrastructure operations, capacity and cost governance across business units.',
        { priority: 240, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Cloud Services Manager',
        'manager_head',
        'Manages cloud service delivery, SLAs and internal customer engagement for shared cloud platforms.',
        { priority: 250, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Head of Cloud Engineering',
        'director_executive',
        'Senior leadership of cloud engineering capability, multi-year cloud strategy and major migration programmes.',
        { priority: 260, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Director of Cloud Strategy',
        'director_executive',
        'Sets enterprise cloud adoption strategy, FinOps governance and hybrid/multi-cloud policy.',
        { priority: 270, eligibilityNote: CLOUD_BOUNDARY }
      ),
      r(
        'Director of Cloud Platforms',
        'director_executive',
        'Executive ownership of cloud platform services, partnerships with AWS/Azure/GCP and organisational cloud maturity.',
        { priority: 280, eligibilityNote: CLOUD_BOUNDARY }
      ),
    ],
  },
  {
    slug: 'cyber-security',
    label: 'Cyber Security',
    professionalBody: 'Chartered Institute of Information Security (CIISec)',
    relatedBodies: ['(ISC)²', 'CompTIA', 'NCSC', 'CREST'],
    sources: [
      'CIISec professional standards',
      'CompTIA Security+',
      '(ISC)² CISSP / SSCP',
      'NCSC Cyber Essentials and UK cyber job market',
    ],
    siblingSlugs: infraSiblings('cyber-security'),
    roles: [
      r(
        'Cyber Security Apprentice',
        'entry_trainee',
        'Apprenticeship in security fundamentals, asset inventory and policy awareness; CompTIA Security+ often pursued during training.',
        { priority: 10, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Graduate Cyber Security Analyst',
        'entry_trainee',
        'Graduate SOC or GRC rotation learning threat monitoring, vulnerability basics and UK regulatory context.',
        { priority: 20, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Security Operations Trainee',
        'entry_trainee',
        'Entry trainee shadowing SOC analysts on alert triage, log review and incident documentation.',
        { priority: 30, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Junior Information Security Trainee',
        'entry_trainee',
        'Supports security awareness campaigns, access reviews and compliance evidence gathering.',
        { priority: 40, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Junior Cyber Security Analyst',
        'junior',
        'Monitors SIEM alerts, investigates phishing reports and escalates incidents under supervision.',
        { priority: 50, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Junior Security Operations Analyst',
        'junior',
        'SOC tier-1 analyst performing alert enrichment, ticket routing and playbook execution.',
        { priority: 60, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Junior Penetration Testing Trainee',
        'junior',
        'Assists qualified testers with reconnaissance, reporting and lab environment setup; CREST pathways common in UK.',
        { priority: 70, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Junior GRC Analyst',
        'junior',
        'Supports governance, risk and compliance activities — policy mapping, control testing and audit prep.',
        { priority: 80, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Cyber Security Analyst',
        'practitioner',
        'Independent threat detection, vulnerability remediation coordination and security tooling administration.',
        { priority: 90, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Security Operations Centre Analyst',
        'practitioner',
        'Tier-2 SOC analyst conducting deep-dive investigations, threat hunting and incident containment.',
        { priority: 100, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Penetration Tester',
        'practitioner',
        'Conducts authorised penetration tests and red-team exercises for UK clients; OSCP or CREST CRT valued.',
        { priority: 110, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Information Security Officer',
        'practitioner',
        'Embedded security partner for business units implementing controls and risk treatment plans.',
        { priority: 120, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Senior Cyber Security Analyst',
        'senior',
        'Leads complex incident response, malware analysis and purple-team collaboration; CISSP or GIAC certs common.',
        { priority: 130, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Senior Penetration Tester',
        'senior',
        'Leads advanced penetration testing engagements, report quality and junior tester mentoring.',
        { priority: 140, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Senior Security Engineer',
        'senior',
        'Engineers security tooling integrations — EDR, DLP, PAM — and hardens infrastructure controls.',
        { priority: 150, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Senior Threat Intelligence Analyst',
        'senior',
        'Produces actionable threat intelligence from OSINT, ISAC feeds and MITRE ATT&CK mapping for UK sectors.',
        { priority: 160, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Lead Cyber Security Analyst',
        'lead_principal',
        'Technical lead for security operations squads defining detection use cases and SOC playbooks.',
        { priority: 170, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Lead Penetration Tester',
        'lead_principal',
        'Leads offensive security team, scoping methodology and client deliverables for consultancy practices.',
        { priority: 180, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Cyber Security Technical Lead',
        'lead_principal',
        'Sets technical standards for security architecture reviews, tooling selection and control frameworks.',
        { priority: 190, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Security Architect',
        'architect_specialist',
        'Designs enterprise security architectures — identity, network segmentation, zero trust — aligned to NCSC guidance.',
        { priority: 200, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Cyber Security Solutions Architect',
        'architect_specialist',
        'Architects integrated security platforms spanning SIEM, SOAR, IAM and cloud security posture.',
        { priority: 210, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Zero Trust Architecture Specialist',
        'architect_specialist',
        'Designs zero-trust reference models for identity-centric access and micro-segmentation programmes.',
        { priority: 220, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Cyber Security Manager',
        'manager_head',
        'Manages security analysts and engineers, budget and roadmap for operational security capabilities.',
        { priority: 230, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Security Operations Manager',
        'manager_head',
        'Oversees SOC staffing, shift patterns, SLA performance and incident escalation procedures.',
        { priority: 240, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Information Security Manager',
        'manager_head',
        'Leads ISO 27001 programmes, risk registers and board-level security reporting for UK organisations.',
        { priority: 250, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Head of Cyber Security',
        'director_executive',
        'Senior leadership of cyber function, regulatory engagement and enterprise risk appetite alignment.',
        { priority: 260, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Director of Information Security',
        'director_executive',
        'Directs information security strategy, third-party risk and security culture across the organisation.',
        { priority: 270, eligibilityNote: CYBER_BOUNDARY }
      ),
      r(
        'Chief Information Security Officer',
        'director_executive',
        'Executive accountable for enterprise cyber risk, incident governance and board cyber resilience reporting.',
        { priority: 280, eligibilityNote: CYBER_BOUNDARY }
      ),
    ],
  },
  {
    slug: 'networking',
    label: 'Networking',
    professionalBody: 'British Computer Society (BCS)',
    relatedBodies: ['Cisco', 'CompTIA', 'Juniper', 'Aruba'],
    sources: [
      'BCS networking skills framework',
      'CompTIA Network+',
      'Cisco CCNA / CCNP Enterprise',
      'UK network engineering roles (LinkedIn, CWJobs)',
    ],
    siblingSlugs: infraSiblings('networking'),
    roles: [
      r(
        'Network Engineering Apprentice',
        'entry_trainee',
        'Apprenticeship cabling, patching, basic switch configuration and network documentation; CompTIA Network+ common.',
        { priority: 10, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Graduate Network Engineer',
        'entry_trainee',
        'Graduate role supporting LAN/WAN operations, monitoring tools and change requests on UK corporate networks.',
        { priority: 20, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Junior Network Support Trainee',
        'entry_trainee',
        'Trainee on NOC/helpdesk hybrid teams triaging connectivity faults and basic switch port issues.',
        { priority: 30, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Network Operations Trainee',
        'entry_trainee',
        'Entry role learning SNMP monitoring, ticket queues and escalation to senior network engineers.',
        { priority: 40, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Junior Network Engineer',
        'junior',
        'Configures switches, routers and wireless APs under change control; Cisco CCNA frequently expected.',
        { priority: 50, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Junior Network Administrator',
        'junior',
        'Maintains network device inventory, VLAN assignments and firewall rule requests with supervision.',
        { priority: 60, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Junior NOC Engineer',
        'junior',
        'Network Operations Centre engineer monitoring links, circuits and carrier escalations 24/7.',
        { priority: 70, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Junior Wireless Network Engineer',
        'junior',
        'Deploys and surveys Wi-Fi coverage, controller configs and guest network policies.',
        { priority: 80, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Network Engineer',
        'practitioner',
        'Independent design and support of routing, switching and firewall policies for enterprise sites.',
        { priority: 90, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Network Administrator',
        'practitioner',
        'Administers core network services — DNS, DHCP, NTP — and device lifecycle management.',
        { priority: 100, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'NOC Engineer',
        'practitioner',
        'Tier-2 NOC engineer resolving complex outages, BGP issues and MPLS circuit faults.',
        { priority: 110, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Wireless Network Engineer',
        'practitioner',
        'Designs enterprise Wi-Fi including heatmaps, QoS and secure authentication (WPA3, 802.1X).',
        { priority: 120, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Senior Network Engineer',
        'senior',
        'Leads datacentre network design, high availability and disaster recovery connectivity.',
        { priority: 130, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Senior Routing and Switching Engineer',
        'senior',
        'Expert in BGP, OSPF, EVPN/VXLAN and campus/core routing for large UK estates; CCNP typical.',
        { priority: 140, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Senior SD-WAN Engineer',
        'senior',
        'Implements SD-WAN overlays, application-aware routing and branch connectivity modernisation.',
        { priority: 150, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Senior Network Security Engineer',
        'senior',
        'Designs firewall policies, IPS/IDS and network segmentation — packet-layer focus, not SOC threat hunting.',
        { priority: 160, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Lead Network Engineer',
        'lead_principal',
        'Technical lead setting network standards, design review gates and mentoring engineers.',
        { priority: 170, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Network Infrastructure Lead',
        'lead_principal',
        'Leads network infrastructure projects — datacentre refreshes, WAN upgrades and carrier RFPs.',
        { priority: 180, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Network Operations Lead',
        'lead_principal',
        'Leads NOC teams, major incident bridges and operational runbook maturity.',
        { priority: 190, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Network Architect',
        'architect_specialist',
        'Designs enterprise network topologies, capacity planning and technology roadmaps for LAN/WAN.',
        { priority: 200, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Enterprise Network Architect',
        'architect_specialist',
        'Architects multi-site corporate networks integrating MPLS, SD-WAN and cloud connectivity.',
        { priority: 210, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'SD-WAN Solutions Architect',
        'architect_specialist',
        'Designs SD-WAN reference architectures and vendor selection for distributed UK organisations.',
        { priority: 220, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Network Engineering Manager',
        'manager_head',
        'Manages network engineering teams, change windows and network project portfolios.',
        { priority: 230, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Network Operations Manager',
        'manager_head',
        'Oversees NOC operations, carrier relationships and network SLA performance.',
        { priority: 240, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Infrastructure Network Manager',
        'manager_head',
        'Manages combined network and connectivity teams spanning campus, WAN and datacentre.',
        { priority: 250, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Head of Network Engineering',
        'director_executive',
        'Senior leadership of network engineering, major refresh programmes and architecture governance.',
        { priority: 260, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Director of Network Infrastructure',
        'director_executive',
        'Directs enterprise network strategy, vendor contracts and resilience investment.',
        { priority: 270, eligibilityNote: NETWORK_BOUNDARY }
      ),
      r(
        'Chief Network Architect',
        'director_executive',
        'Executive technical authority for enterprise network design and long-range connectivity strategy.',
        { priority: 280, eligibilityNote: NETWORK_BOUNDARY }
      ),
    ],
  },
  {
    slug: 'systems-administration',
    label: 'Systems Administration',
    professionalBody: 'British Computer Society (BCS)',
    relatedBodies: ['Microsoft', 'Red Hat', 'VMware', 'CompTIA'],
    sources: [
      'BCS infrastructure skills framework',
      'CompTIA Server+ / Linux+',
      'Microsoft Certified: Windows Server Hybrid Administrator',
      'Red Hat Certified System Administrator',
      'UK systems admin roles (Reed, LinkedIn)',
    ],
    siblingSlugs: infraSiblings('systems-administration'),
    roles: [
      r(
        'Systems Administration Apprentice',
        'entry_trainee',
        'Apprenticeship learning server builds, patching cycles and backup verification; CompTIA A+ or Server+ common starters.',
        { priority: 10, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Graduate Systems Administrator',
        'entry_trainee',
        'Graduate role supporting Windows/Linux servers, AD objects and monitoring alerts in UK IT departments.',
        { priority: 20, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Junior Server Support Trainee',
        'entry_trainee',
        'Trainee assisting with server racking, OS imaging and ticket-based break/fix under senior admins.',
        { priority: 30, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Windows Server Trainee',
        'entry_trainee',
        'Entry trainee on Active Directory, Group Policy and Windows Server patching tasks.',
        { priority: 40, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Junior Systems Administrator',
        'junior',
        'Administers servers, applies patches and manages backup jobs with change control.',
        { priority: 50, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Junior Linux Administrator',
        'junior',
        'Maintains Linux hosts, package management and shell scripting; RHCSA pathway common.',
        { priority: 60, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Junior Windows Server Administrator',
        'junior',
        'Manages AD users/groups, DNS/DHCP on Windows Server and Hyper-V guest VMs.',
        { priority: 70, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Junior Virtualisation Administrator',
        'junior',
        'Supports VMware or Hyper-V clusters, snapshots and resource allocation under guidance.',
        { priority: 80, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Systems Administrator',
        'practitioner',
        'Independent server administration across mixed OS estates, patching and capacity monitoring.',
        { priority: 90, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Linux Systems Administrator',
        'practitioner',
        'Owns Linux production servers, automation with Ansible and performance troubleshooting.',
        { priority: 100, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Windows Server Administrator',
        'practitioner',
        'Manages enterprise Windows Server, AD forest health and PKI/certificate services.',
        { priority: 110, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Virtualisation Administrator',
        'practitioner',
        'Operates VMware vSphere or Hyper-V farms, HA/DRS and storage integration.',
        { priority: 120, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Senior Systems Administrator',
        'senior',
        'Leads server standard builds, hardening baselines and major OS upgrade programmes.',
        { priority: 130, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Senior Linux Engineer',
        'senior',
        'Expert Linux administration for high-availability services, container hosts and kernel tuning.',
        { priority: 140, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Senior Windows Infrastructure Engineer',
        'senior',
        'Owns Active Directory design changes, GPO strategy and Windows infrastructure resilience.',
        { priority: 150, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Senior VMware Administrator',
        'senior',
        'Leads virtualisation platform upgrades, NSX networking and vSAN storage operations.',
        { priority: 160, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Lead Systems Administrator',
        'lead_principal',
        'Technical lead for systems admin teams defining build standards and escalation paths.',
        { priority: 170, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Infrastructure Systems Lead',
        'lead_principal',
        'Leads on-prem infrastructure workstreams — server refreshes, storage and backup modernisation.',
        { priority: 180, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Server Infrastructure Lead',
        'lead_principal',
        'Drives server platform roadmap, lifecycle management and vendor technical relationships.',
        { priority: 190, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Infrastructure Architect (Systems)',
        'architect_specialist',
        'Designs on-prem server, storage and virtualisation reference architectures — not cloud landing zones.',
        { priority: 200, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Server Platform Architect',
        'architect_specialist',
        'Architects enterprise server platforms including OS standardisation, patching and DR tiers.',
        { priority: 210, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Enterprise Systems Architect',
        'architect_specialist',
        'Designs integrated systems infrastructure spanning AD, mail, file and compute services.',
        { priority: 220, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Systems Administration Manager',
        'manager_head',
        'Manages systems administrators, on-call rota and server infrastructure projects.',
        { priority: 230, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Server Infrastructure Manager',
        'manager_head',
        'Oversees server teams, datacentre operations and hardware refresh budgets.',
        { priority: 240, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'IT Infrastructure Manager (Systems)',
        'manager_head',
        'Manages broader on-prem infrastructure teams spanning servers, storage and virtualisation.',
        { priority: 250, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Head of Systems Administration',
        'director_executive',
        'Senior leadership of systems administration function and datacentre operational strategy.',
        { priority: 260, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Director of Server Infrastructure',
        'director_executive',
        'Directs enterprise server platform strategy, vendor contracts and resilience investment.',
        { priority: 270, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
      r(
        'Director of IT Infrastructure (On-Prem)',
        'director_executive',
        'Executive oversight of on-premises infrastructure operations distinct from cloud platform teams.',
        { priority: 280, eligibilityNote: SYSADMIN_BOUNDARY }
      ),
    ],
  },
  {
    slug: 'it-support',
    label: 'IT Support',
    professionalBody: 'British Computer Society (BCS)',
    relatedBodies: ['CompTIA', 'ITIL (Axelos)', 'Microsoft', 'HDI'],
    sources: [
      'BCS IT support skills framework',
      'CompTIA A+',
      'ITIL 4 Foundation',
      'Google IT Support Professional Certificate',
      'UK helpdesk and service desk roles (Indeed, Reed)',
    ],
    siblingSlugs: infraSiblings('it-support'),
    roles: [
      r(
        'IT Support Apprentice',
        'entry_trainee',
        'Apprenticeship on first-line user support, ticket logging and basic hardware troubleshooting; CompTIA A+ often pursued.',
        { priority: 10, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'IT Helpdesk Trainee',
        'entry_trainee',
        'Trainee answering phones and emails, resetting passwords and escalating complex issues.',
        { priority: 20, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Service Desk Apprentice',
        'entry_trainee',
        'Structured apprenticeship in ITIL-aligned service desk processes, SLAs and customer communication.',
        { priority: 30, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Desktop Support Trainee',
        'entry_trainee',
        'Entry trainee imaging laptops, installing software and supporting office users on-site.',
        { priority: 40, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'First Line Support Trainee',
        'entry_trainee',
        'First-line support trainee triaging incidents via phone, chat and self-service portal.',
        { priority: 50, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'IT Service Desk Graduate',
        'entry_trainee',
        'Graduate rotation on service desk teams learning ITIL incident/problem management; degree optional.',
        { priority: 60, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Junior IT Support Technician',
        'junior',
        'Resolves common desktop, M365 and VPN issues for end users; ITIL Foundation valued.',
        { priority: 70, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Junior Helpdesk Analyst',
        'junior',
        'Helpdesk analyst handling tier-1 tickets, knowledge base updates and remote support sessions.',
        { priority: 80, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Junior Service Desk Analyst',
        'junior',
        'Service desk analyst working within ITIL processes for incident categorisation and escalation.',
        { priority: 90, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Junior Desktop Support Engineer',
        'junior',
        'On-site desktop support for hardware swaps, peripheral setup and local network connectivity checks.',
        { priority: 100, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Junior Field Support Technician',
        'junior',
        'Travels to client or branch sites resolving user device and connectivity issues.',
        { priority: 110, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Junior End User Computing Technician',
        'junior',
        'Supports end-user devices, Intune enrolment and standard software catalogue deployments.',
        { priority: 120, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'IT Support Technician',
        'practitioner',
        'Independent tier-2 support for complex desktop, application and access issues.',
        { priority: 130, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Helpdesk Analyst',
        'practitioner',
        'Experienced helpdesk analyst managing priority queues and mentoring junior staff.',
        { priority: 140, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Service Desk Analyst',
        'practitioner',
        'Mid-level service desk role coordinating major incidents and problem record creation.',
        { priority: 150, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Desktop Support Engineer',
        'practitioner',
        'Senior hands-on desktop engineer supporting VIP users, AV setups and device refresh programmes.',
        { priority: 160, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Senior IT Support Technician',
        'senior',
        'Senior technician handling escalated incidents, root-cause analysis and knowledge articles.',
        { priority: 170, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Senior Service Desk Analyst',
        'senior',
        'Leads shift handovers, quality assurance and ITIL continual service improvement initiatives.',
        { priority: 180, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Senior Desktop Support Engineer',
        'senior',
        'Owns desktop engineering standards, packaging and pilot groups for OS upgrades.',
        { priority: 190, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'IT Support Team Lead',
        'lead_principal',
        'Team lead for support technicians managing rota, KPIs and escalation to infrastructure teams.',
        { priority: 200, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Service Desk Team Lead',
        'lead_principal',
        'Leads service desk shift, SLA adherence and coaching for analysts.',
        { priority: 210, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'End User Computing Lead',
        'lead_principal',
        'Leads end-user computing workstream — device standards, Intune policies and user experience.',
        { priority: 220, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'IT Service Management Architect (ITIL)',
        'architect_specialist',
        'Designs ITIL-aligned service management processes, toolchains and service catalogue — not infrastructure architecture.',
        { priority: 230, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'IT Support Manager',
        'manager_head',
        'Manages IT support teams, staffing models and customer satisfaction metrics.',
        { priority: 240, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Service Desk Manager',
        'manager_head',
        'Oversees service desk operations, vendor SLAs and ITIL process maturity.',
        { priority: 250, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'End User Computing Manager',
        'manager_head',
        'Manages desktop and mobility support teams, device lifecycle and workplace technology.',
        { priority: 260, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Head of IT Support',
        'director_executive',
        'Senior leadership of user support function, service desk strategy and budget.',
        { priority: 270, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
      r(
        'Director of Service Desk Operations',
        'director_executive',
        'Directs enterprise service desk, outsourced support contracts and ITSM tooling investment.',
        { priority: 280, eligibilityNote: IT_SUPPORT_BOUNDARY }
      ),
    ],
  },
  {
    slug: 'database-administration',
    label: 'Database Administration',
    professionalBody: 'British Computer Society (BCS)',
    relatedBodies: ['Oracle', 'Microsoft', 'PostgreSQL Global Development Group', 'MongoDB'],
    sources: [
      'BCS data management skills framework',
      'Oracle Certified Professional (OCP)',
      'Microsoft Certified: Azure Database Administrator Associate',
      'UK DBA roles (LinkedIn, CWJobs)',
    ],
    siblingSlugs: infraSiblings('database-administration'),
    roles: [
      r(
        'Database Administration Apprentice',
        'entry_trainee',
        'Apprenticeship learning backup routines, SQL basics and monitoring alerts on database platforms.',
        { priority: 10, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Graduate Database Administrator',
        'entry_trainee',
        'Graduate DBA supporting production databases, patch cycles and access requests under supervision.',
        { priority: 20, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Junior DBA Trainee',
        'entry_trainee',
        'Trainee assisting with index maintenance, job scheduling and restore testing in lab environments.',
        { priority: 30, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'SQL Server Trainee',
        'entry_trainee',
        'Entry trainee on Microsoft SQL Server installs, agent jobs and basic T-SQL troubleshooting.',
        { priority: 40, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Junior Database Administrator',
        'junior',
        'Junior DBA performing backups, space management and user permission changes with review.',
        { priority: 50, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Junior SQL Server DBA',
        'junior',
        'Maintains SQL Server instances, Always On availability groups and maintenance plans.',
        { priority: 60, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Junior Oracle DBA',
        'junior',
        'Supports Oracle databases — tablespaces, RMAN backups and patch application.',
        { priority: 70, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Junior PostgreSQL DBA',
        'junior',
        'Administers PostgreSQL clusters, replication and vacuum tuning under senior guidance.',
        { priority: 80, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Database Administrator',
        'practitioner',
        'Independent DBA owning production database health, patching and performance baselines.',
        { priority: 90, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'SQL Server DBA',
        'practitioner',
        'Mid-level SQL Server DBA managing enterprise instances, SSIS/SSRS and high availability.',
        { priority: 100, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Oracle Database Administrator',
        'practitioner',
        'Mid-level Oracle DBA for RAC, Data Guard and enterprise ERP/database estates.',
        { priority: 110, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'PostgreSQL DBA',
        'practitioner',
        'Owns PostgreSQL production systems, connection pooling and query optimisation.',
        { priority: 120, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Senior Database Administrator',
        'senior',
        'Leads database upgrade programmes, DR testing and DBA best-practice standards.',
        { priority: 130, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Senior SQL Server DBA',
        'senior',
        'Expert SQL Server administration for mission-critical transactional and reporting systems.',
        { priority: 140, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Senior Oracle DBA',
        'senior',
        'Senior Oracle specialist for complex RAC, partitioning and performance diagnostics.',
        { priority: 150, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Senior Database Performance Engineer',
        'senior',
        'Specialises in query tuning, execution plans and database performance benchmarking.',
        { priority: 160, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Lead Database Administrator',
        'lead_principal',
        'Technical lead for DBA teams setting backup, security and change-management standards.',
        { priority: 170, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Database Platform Lead',
        'lead_principal',
        'Leads database platform roadmap, vendor selection and migration programmes.',
        { priority: 180, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Data Platform Lead',
        'lead_principal',
        'Leads operational data platform teams spanning RDBMS and managed cloud database services.',
        { priority: 190, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Database Architect',
        'architect_specialist',
        'Designs database schemas, HA topologies and data retention architectures for enterprise systems.',
        { priority: 200, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Database Platform Architect',
        'architect_specialist',
        'Architects integrated database platforms combining RDBMS, caching and cloud-managed database tiers.',
        { priority: 210, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Enterprise Database Solutions Architect',
        'architect_specialist',
        'Designs enterprise database strategy — engine selection, licensing and DR tiers.',
        { priority: 220, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Database Administration Manager',
        'manager_head',
        'Manages DBA teams, on-call coverage and database project delivery.',
        { priority: 230, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Database Platform Operations Manager',
        'manager_head',
        'Oversees database platform operations, cloud DBaaS adoption and operational KPIs.',
        { priority: 240, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Database Services Manager',
        'manager_head',
        'Manages database shared services, internal customer SLAs and capacity planning.',
        { priority: 250, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Head of Database Administration',
        'director_executive',
        'Senior leadership of DBA function, enterprise data platform strategy and major migrations.',
        { priority: 260, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Director of Data Platform Services',
        'director_executive',
        'Directs operational data platform services spanning on-prem and cloud-managed databases.',
        { priority: 270, eligibilityNote: DBA_BOUNDARY }
      ),
      r(
        'Chief Database Architect',
        'director_executive',
        'Executive technical authority for enterprise database architecture and platform standards.',
        { priority: 280, eligibilityNote: DBA_BOUNDARY }
      ),
    ],
  },
]
