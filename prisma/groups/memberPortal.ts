export const permissions = [
    "member-portal.member.create",
    "member-portal.member.delete",
    "member-portal.member.update-self",

    "member-portal.tenure.create",
    "member-portal.tenure.update",

    "member-portal.team.create",
    "member-portal.team.update",
    "member-portal.team.delete",

    "member-portal.team-member.create",
    "member-portal.team-member.delete",
    "member-portal.team-member.update-type",
    "member-portal.team-member.update-type.special"
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
        description: "Can manage team members within their team, including creating, deleting, and updating member roles.",
        permissions: [
            "member-portal.team-member.create",
            "member-portal.team-member.delete",
            "member-portal.team-member.update-type"
        ],
    },
    {
        name: "member-portal.member",
        description: "Basic role with ability to update their own profile.",
        permissions: [
            "member-portal.member.update-self"
        ]
    }
]