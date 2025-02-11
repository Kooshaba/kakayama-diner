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
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*', // Allow all origins
			'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', // Allow specific methods
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
			const data = (await request.json()) as {
				customer_name: string;
				customer_email: string;
				customer_phone: string;
				reservation_date: string;
				reservation_time: string;
				number_of_guests: number;
				special_requests: string;
				allergy: string;
				communication_consent: boolean;
			};

			// Check if reservation is for current day
			const today = new Date();
			const reservationDate = new Date(data.reservation_date);

			// Reset time parts to compare just the dates
			today.setHours(0, 0, 0, 0);
			reservationDate.setHours(0, 0, 0, 0);

			if (reservationDate.getTime() === today.getTime()) {
				return new Response('Cannot make reservations for the current day', {
					status: 400,
					headers: corsHeaders,
				});
			}

			await env.DB.prepare(
				`INSERT INTO reservations (customer_name, customer_email, customer_phone, reservation_date, reservation_time, number_of_guests, special_requests, allergy, communication_consent)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					data.customer_name,
					data.customer_email,
					data.customer_phone,
					data.reservation_date,
					data.reservation_time,
					data.number_of_guests,
					data.special_requests,
					data.allergy,
					data.communication_consent
				)
				.run();
			return new Response('Reservation created', { status: 201, headers: corsHeaders });
		}

		if (path === '/blocked-days' && request.method === 'POST') {
			// Create a date block
			const data = (await request.json()) as { block_date: string };
			await env.DB.prepare('INSERT INTO blocked_days (block_date) VALUES (?)').bind(data.block_date).run();
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
			const data = (await request.json()) as { added_date: string };
			await env.DB.prepare('INSERT INTO added_days (added_date) VALUES (?)').bind(data.added_date).run();
			return new Response('Added day created', { status: 201, headers: corsHeaders });
		}

		if (path === '/added-days' && request.method === 'GET') {
			// List all added days
			const addedDays = await env.DB.prepare('SELECT * FROM added_days').all();
			console.log('Added days rows:', addedDays);
			return new Response(JSON.stringify(addedDays), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		if (path === '/added-days' && request.method === 'DELETE') {
			try {
				const { date } = (await request.json()) as { date: string };

				if (!date) {
					return new Response('Date is required', {
						status: 400,
						headers: corsHeaders,
					});
				}

				// Delete the added day from the database
				await env.DB.prepare('DELETE FROM added_days WHERE added_date = ?').bind(date).run();

				return new Response(JSON.stringify({ success: true }), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error(`Error deleting added day:`, error);
				return new Response('Failed to delete added day', {
					status: 500,
					headers: corsHeaders,
				});
			}
		}

		if (path === '/unblock-day' && request.method === 'POST') {
			const data = (await request.json()) as { date: string };
			const { date } = data;
			console.log(`Attempting to unblock date: ${date}`);

			if (!date) {
				console.warn('Unblock request received without date');
				return new Response('Date is required', { status: 400 });
			}

			try {
				// Delete the blocked day from the database
				const result = await env.DB.prepare('DELETE FROM blocked_days WHERE block_date = ?').bind(date).run();
				console.log(`Unblock result for ${date}:`, result);

				return new Response(JSON.stringify({ success: true }), {
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error(`Error unblocking date ${date}:`, error);
				return new Response('Failed to unblock day', { status: 500 });
			}
		}

		return new Response('Not Found', { status: 404, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
