import { google, calendar_v3 } from "googleapis"
import { WebClient } from "@slack/client"
import { peril } from "danger"
import fetch from "node-fetch"
import * as querystring from "querystring"
import { concat, uniq } from "lodash"

// From artsy's peril settings.

let googleKey: any = JSON.parse(peril.env.GOOGLE_APPS_PRIVATE_KEY_JSON || "{}")
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
const CALENDAR_ID = peril.env.ON_CALL_CALENDAR_ID || ""

export default async () => {
	// Backed by Google Calendar
	const events = await retrieveCalendarEvents()
	// const calendarOnCallStaffEmails = emailsForCalendarEvents(events)
	//
	// await sendMessageForEmails(calendarOnCallStaffEmails)
}

const retrieveCalendarEvents = async (): Promise<calendar_v3.Schema$Event[]> => {
	let jwtClient = new google.auth.JWT(googleKey.client_email, undefined, googleKey.private_key, SCOPES)
	try {
		await jwtClient.authorize()
	} catch (error) {
		console.error(`Couldn't authorize: ${error}`)
	}
	const cal = google.calendar({ version: "v3", auth: jwtClient })
	try {
		const response = await cal.events.list({
			calendarId: CALENDAR_ID,
			timeMin: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), // Look a week ago.
			maxResults: 10,
			singleEvents: true,
			orderBy: "startTime",
		})
		return response.data.items || []
	} catch (error) {
		console.error("The API returned an error: " + error)
		return []
	}
}

export const sendMessageForEmails = async (emails: string[]) => {
	console.log(`The following emails are on call: ${emails}. Now looking up Slack IDs.`)

	const slackToken = peril.env.SLACK_WEB_API_TOKEN
	const web = new WebClient(slackToken)
	const onCallStaffUsers = await Promise.all(emails.map(email => web.users.lookupByEmail({ email })))

	const onCallStaffMentions = onCallStaffUsers
		.filter(r => r.ok) // Filter out any failed lookups.
		.map((response: any) => response.user.id as string)
		.map(id => `<@${id}>`) // See: https://api.slack.com/docs/message-formatting#linking_to_channels_and_users

	const { slackMessage } = await import("./slackDevChannel")

	await slackMessage(
		`${onCallStaffMentions.join(
			", "
		)} it looks like you're on-call this week.  You’ll be running the Monday standup at 10:30am.`
	)
}

function filterUndefineds<T>(t: T | undefined): t is T {
	return t !== undefined
}
