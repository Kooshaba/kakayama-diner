/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*', // Allow all origins
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allow specific methods
			'Access-Control-Allow-Headers': 'Content-Type', // Allow specific headers
		};

		if (request.method === 'OPTIONS') {
			// Handle CORS preflight request
			return new Response(null, { headers: corsHeaders });
		}

		if (path === '/reservations' && request.method === 'GET') {
			// List all reservations
			const reservations = await env.DB.prepare('SELECT * FROM reservations').all();
			return new Response(JSON.stringify(reservations), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
		}

		if (path === '/reservations' && request.method === 'POST') {
			// Create a reservation
			const data = await request.json();
			const {
				customer_name,
				customer_email,
				customer_phone,
				reservation_date,
				reservation_time,
				number_of_guests,
				special_requests,
				allergy,
				communication_consent,
			} = data;
			await env.DB.prepare(
				`INSERT INTO reservations (customer_name, customer_email, customer_phone, reservation_date, reservation_time, number_of_guests, special_requests, allergy, communication_consent)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					customer_name,
					customer_email,
					customer_phone,
					reservation_date,
					reservation_time,
					number_of_guests,
					special_requests,
					allergy,
					communication_consent
				)
				.run();
			return new Response('Reservation created', { status: 201, headers: corsHeaders });
		}

		if (path === '/blocked-days' && request.method === 'POST') {
			// Create a date block
			const data = await request.json();
			const { block_date } = data;
			await env.DB.prepare('INSERT INTO blocked_days (block_date) VALUES (?)').bind(block_date).run();
			return new Response('Date block created', { status: 201, headers: corsHeaders });
		}

		if (path === '/blocked-days' && request.method === 'GET') {
			// List all blocked days
			const blockedDays = await env.DB.prepare('SELECT * FROM blocked_days').all();
			return new Response(JSON.stringify(blockedDays), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		if (path === '/added-days' && request.method === 'POST') {
			// Create an added day
			const data = await request.json();
			const { added_date } = data;
			await env.DB.prepare('INSERT INTO added_days (added_date) VALUES (?)').bind(added_date).run();
			return new Response('Added day created', { status: 201, headers: corsHeaders });
		}

		if (path === '/added-days' && request.method === 'GET') {
			// List all added days
			const addedDays = await env.DB.prepare('SELECT * FROM added_days').all();
			return new Response(JSON.stringify(addedDays), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response('Not Found', { status: 404, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
