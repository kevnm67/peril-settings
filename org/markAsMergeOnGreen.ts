import { danger } from "danger"
import { IssueComment, PullRequestReview } from "github-webhook-event-types"
import { IssueCommentIssue } from "github-webhook-event-types/source/IssueComment"

/** If a comment to an issue contains "Merge on Green", apply a label for it to be merged when green. */
export const rfc10 = async (issueCommentOrPrReview: IssueComment | PullRequestReview) => {
  const api = danger.github.api
  const org = issueCommentOrPrReview.repository.owner.login

  let issue: IssueCommentIssue = null!
  let text: string = null!
  let userLogin: string = ""

  if ("issue" in issueCommentOrPrReview) {
    issue = issueCommentOrPrReview.issue
    text = issueCommentOrPrReview.comment.body
    userLogin = issueCommentOrPrReview.comment.user.login

    // Only look at PR issue comments, this isn't in the type system
    if (!(issue as any).pull_request) {
      return console.log("Not a Pull Request")
    }
  }

  if ("review" in issueCommentOrPrReview) {
    const repo = issueCommentOrPrReview.repository
    const response = await api.issues.get({
      owner: repo.owner.login,
      repo: repo.name,
      number: issueCommentOrPrReview.pull_request.number,
    })

    issue = response.data as any
    text = issueCommentOrPrReview.review.body
    userLogin = issueCommentOrPrReview.review.user.login
  }

  // Bail if there's no text from the review
  if (!text) {
    console.log("Could not find text for the webhook to look for the merge on green message")
    return
  }

  // Don't do any work unless we have to
  const keywords = ["#mergeongreen"]
  const match = keywords.find(k => text.toLowerCase().includes(k))
  if (!match) {
    return console.log(`Did not find any of the merging phrases in the comment beginning ${text.substring(0, 12)}.`)
  }

  // Check to see if the label has already been set
  if (issue.labels.find(l => l.name === "Merge On Green")) {
    return console.log("Already has Merge on Green")
  }

  // Check for org access, so that some rando doesn't
  // try to merge something without permission
  try {
    if (userLogin !== org) {
      await api.orgs.checkMembership({ org, username: userLogin })
    }
  } catch (error) {
    // Someone does not have permission to force a merge
    return console.log("Sender does not have permission to merge")
  }

  // Let's people know that it will be merged
  const label = {
    name: "Merge On Green",
    color: "247A38",
    description: "A label to indicate that Peril should merge this PR when all statuses are green",
  }
  const repo = {
    owner: org,
    repo: issueCommentOrPrReview.repository.name,
    id: issue.number,
  }

  console.log("Adding the label:", repo)
  await danger.github.utils.createOrAddLabel(label, repo)
  console.log("Updated the PR with a Merge on Green label")
}

export default rfc10
