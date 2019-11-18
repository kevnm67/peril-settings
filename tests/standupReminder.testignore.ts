// import { calendar_v3 } from "googleapis"
//
// jest.mock("danger", () => ({
//   peril: {
//     env: {},
//   },
// }))
//
// const mockSlackDevChannel = jest.fn()
// jest.mock("../tasks/slackDevChannel", () => ({
//   slackMessage: mockSlackDevChannel,
// }))
//
// const mockLookupByEmail = jest.fn()
// jest.mock("@slack/client", () => ({
//   WebClient: jest.fn().mockImplementation(() => ({
//     users: {
//       lookupByEmail: mockLookupByEmail,
//     },
//   })),
// }))
//
// const mockSuccessResponse = {
//   data: {
//     onCallParticipants: [
//       {
//         name: "frontenddev@example.com",
//       },
//       {
//         name: "backenddev@example.com",
//       },
//     ],
//   },
// }
// const mockJsonPromise = Promise.resolve(mockSuccessResponse)
// const mockFetchPromise = Promise.resolve({
//   json: () => mockJsonPromise,
// })
//
// jest.mock("node-fetch", () => {
//   return {
//     default: () => mockFetchPromise,
//   }
// })
//
// import { sendMessageForEmails, emailsForCalendarEvents } from "../tasks/standupReminder"
//
// const today = "2019-01-07"
// const events = [
//   {
//     // One event that starts today.
//     start: { date: today },
//     end: { date: "2019-01-14" },
//     attendees: [{ email: "backenddev@example.com" }],
//   },
//   {
//     // One event that spans today.
//     start: { date: "2019-01-02" },
//     end: { date: "2019-01-09" },
//     attendees: [{ email: "frontenddev@example.com" }],
//   },
//   {
//     // And one event that ends today.
//     start: { date: "2018-12-31" },
//     end: { date: today },
//     attendees: [{ email: "eloy@example.com" }],
//   },
// ] as calendar_v3.Schema$Event[]

// describe("Monday standup reminders", () => {
//   beforeEach(() => {
//     console.log = jest.fn()
//   })
//
//   it("sends a message", async () => {
//     await sendMessageForEmails([])
//     expect(mockSlackDevChannel).toHaveBeenCalled()
//   })
//
//   describe("with mocked email lookup", () => {
//     beforeEach(() => {
//       mockLookupByEmail.mockImplementation(async obj => {
//         if (obj.email.startsWith("backenddev@")) {
//           return { ok: true, user: { id: "BACKENDDEVID" } }
//         } else if (obj.email.startsWith("frontenddev@")) {
//           return { ok: true, user: { id: "FRONTENDDEVID" } }
//         } else {
//           return { ok: false }
//         }
//       })
//     })
//
//     it("looks up attendees on slack and mentions them", async () => {
//       var receivedMessage
//       mockSlackDevChannel.mockImplementation(message => (receivedMessage = message))
//       const emails = emailsForCalendarEvents(events, new Date(today))
//       await sendMessageForEmails(emails)
//       expect(receivedMessage).toEqual(
//         "<@BACKENDDEVID>, <@FRONTENDDEVID> it looks like you're on-call this week, so you’ll be running the Monday standup at 11:30am time."
//       )
//     })
//
//     it("skips failed email lookups", async () => {
//       events[1].attendees = [{ email: "unknown@user.com" }]
//       var receivedMessage
//       mockSlackDevChannel.mockImplementation(message => (receivedMessage = message))
//       const emails = emailsForCalendarEvents(events, new Date(today))
//
//       await sendMessageForEmails(emails)
//       expect(receivedMessage).toEqual(
//         "<@BACKENDDEVID> it looks like you're on-call this week, so you’ll be running the Monday standup at 11:30am time."
//       )
//     })
//
//     it("fetches on-call participants from OpsGenie", async () => {
//       var receivedMessage
//       mockSlackDevChannel.mockImplementation(message => (receivedMessage = message))
//
//       const emails = await emailsFromOpsGenie(new Date(today))
//
//       await sendMessageForEmails(emails)
//       expect(receivedMessage).toEqual(
//         "<@FRONTENDDEVID>, <@BACKENDDEVID> it looks like you're on-call this week, so you’ll be running the Monday standup at 11:30am time."
//       )
//     })
//   })
// })
