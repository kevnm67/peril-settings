import { danger, markdown, peril } from "danger"
import { Issues } from "github-webhook-event-types"

const staleMessage = `\
Hey! It looks like this repo hasn't been updated for a while. \
That probably means the repo's not a high-priority for @kevnm67. He'll answer \
this issue if he can, but just a head's up.

If you're using this project, you have the skills to improve it. If you've \
reported a bug, you are encouraged to open a pull request that fixes it. \
And of course, you're welcome to discuss with other developers in this \
repository's issues and pull requests. Have a great day!`

export const markRepoAsStale = async () => {
  const issue = (danger.github as any) as Issues
  const repoName = issue.repository.name
  const api = danger.github.api
  const now = new Date()
  const sixMonthsAgo = now.setMonth(now.getMonth() - 6)

  const result = await api.repos.get({ repo: repoName, owner: "kevnm67" })
  // `pushed_at` is the last time that any commit was made to any branch.
  if (Date.parse(result.data.pushed_at) < sixMonthsAgo) {
    markdown(staleMessage)
  }
}

export const vacation = () => {
  const vacationEndDate = peril.env.VACATION_END_DATE
  if (!vacationEndDate) {
    return
  }
  markdown(
    `Hello! Thanks for the issue, but I'm is on vacation until ${vacationEndDate}. Hopefully there's another contributor available to help in the meantime – good luck!`
  )
}

export default async () => {
  await markRepoAsStale()
  vacation()
}
