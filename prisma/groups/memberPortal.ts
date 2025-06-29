export const permissions = [
    "member-portal.member.create",
    "member-portal.member.delete",

    "member-portal.member-card.update-self",

    "member-portal.tenure.create",
    "member-portal.tenure.update",
    "member-portal.tenure.delete",

    "member-portal.team.create",
    "member-portal.team.update",
    "member-portal.team.delete",

    "member-portal.team-member.create",
    "member-portal.team-member.delete",
    "member-portal.team-member.update-type",
]

export const groups = [
    {
        name: "member-portal.core",
        description: "Full access to all member portal features, including member, tenure, team, and team member management.",
        permissions: [
            ...permissions
        ],
    },
    {
        name: "member-portal.team-lead",
        description: "Can manage team members within their team.",
        permissions: [
            "member-portal.team-member.create",
            "member-portal.team-member.delete",
        ],
    },
    {
        name: "member-portal.member",
        description: "Basic role with ability to update their own profile.",
        permissions: [
            "member-portal.member-card.update-self"
        ]
    }
]