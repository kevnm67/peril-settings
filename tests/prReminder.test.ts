jest.mock("danger", () => jest.fn());
import * as danger from "danger";
const dm = danger as any;

import prReminder from "../tasks/prReminder"

beforeEach(() => {
  dm.danger = {
    github: {
      api: {
        pulls: {
          listReviews: jest.fn().mockReturnValue({
            data: [
              {
                user: {
                  login: "stan",
                },
              },
            ],
          }),
          get: jest.fn().mockReturnValue({
            data: {
              requested_reviewers: [
                {
                  login: "kevnm67",
                },
              ],
              state: "open",
            },
          }),
        },
        issues: {
          createComment: jest.fn(),
        },
      },
    },
  }
})

describe("pr review reminder", () => {
  it("comments when the only requested reviewer has not submitted a review", async () => {
    const createComment = dm.danger.github.api.issues.createComment

    const metadata = {
      repoName: "kevnm67",
      prNumber: 1,
      requestedReviewer: "kevnm67",
      owner: "kevnm67",
    }

    await prReminder(metadata)
    expect(createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "@kevnm67 it's been a day since you were requested for a PR review.\nPlease add your review.",
      })
    )
  })

  it("only reminds the reviewer who has not left a review when one of the two assigned submitted a review", async () => {
    const createComment = dm.danger.github.api.issues.createComment
    const metadata = {
      repoName: "kevnm67",
      prNumber: 1,
      requestedReviewer: "kevnm67",
      owner: "kevnm67",
    }

    dm.danger.github.api.pulls.get = jest.fn().mockReturnValue({
      data: {
        requested_reviewers: [
          {
            login: "stan",
          },
          {
            login: "kevnm67",
          },
        ],
        state: "open",
      },
    })
    await prReminder(metadata)
    expect(createComment).toHaveBeenCalledTimes(1)
    expect(createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "@kevnm67 it's been a day since you were requested for a PR review.\nPlease add your review.",
      })
    )
  })

  it("does not add a comment when reviewer submitted their review", async () => {
    const createComment = dm.danger.github.api.issues.createComment
    const metadata = {
      repoName: "kevnm67",
      prNumber: 1,
      requestedReviewer: "kevnm67",
      owner: "kevnm67",
    }

    dm.danger.github.api.pulls = {
      get: jest.fn().mockReturnValue({
        data: {
          requested_reviewers: [
            {
              login: "stan",
            },
            {
              login: "kevnm67",
            },
          ],
          state: "open",
        },
      }),
      listReviews: jest.fn().mockReturnValue({
        data: [
          {
            user: {
              login: "kevnm67",
            },
          },
        ],
      }),
    }

    await prReminder(metadata)
    expect(createComment).not.toHaveBeenCalled()
  })

  it("does not add a comment when pr is closed", async () => {
    const createComment = dm.danger.github.api.issues.createComment
    const metadata = {
      repoName: "kevnm67",
      prNumber: 1,
      requestedReviewer: "kevnm67",
      owner: "kevnm67",
    }

    dm.danger.github.api.pulls.get = jest.fn().mockReturnValue({
      data: {
        requested_reviewers: [
          {
            login: "stan",
          },
          {
            login: "kevnm67",
          },
        ],
        state: "closed",
      },
    })
    await prReminder(metadata)
    expect(createComment).not.toHaveBeenCalled()
  })
})
