const API = "https://jsonplaceholder.typicode.com";

const link = (to = "?", text = "home") => `<a href="${to}">${text}</a>`;

const list = (data, item) => `
	<ul>
		${data.map(item).join("")}
	</ul>
`;

const homePage = posts => list(
	posts,
	({ id, title }) => `<li>${link("?postId=" + id, title)}</li>`
);

const errorPage = data => `
	<p>${data}</p>
	go to ${link()}
`;

const userPage = data => typeof data === "object"
	? list(Object.keys(data), k => `<li>${k}: ${userPage(data[k])}</li>`)
	: data;

const author = data => data
	? link(`?userId=${data.id}`, data.name)
	: "(loading...)";

const comments = data => list(data, c => `
	<li>
		<h4>${c.name} (${link("mailto:" + c.email, c.email)})</h4>
		${c.body}
	</li>
`);

const detailView = post => `
	<header>
		<h2>${post.title}</h2>
		<span>author: ${author(post.user)}</b></span>
		<hr />
	</header>
	<article> ${post.body} </article>
	<section>
		<h3>comments</h3>
		${post.comments && comments(post.comments)}
	</section>
	<footer>${link()}</footer>
`;

function detailPage(data) {
	const { id, userId, user, comments } = data;
	const dataRequests = [];
	const ajaxIf = (cond, endpoint, cb) => {
		if (cond) {
			const promise = getData(endpoint).then(cb);
			dataRequests.push(promise);
		}
	};
	ajaxIf(!user, `${API}/users/${userId}`, userData => data.user = userData);
	ajaxIf(!comments, `${API}/posts/${id}/comments`, r => data.comments = r);
	if (dataRequests.length)
		Promise.all(dataRequests).then(() => render(detailPage, data));
	return detailView(data);
}

router();

function router() {
	const query = (new URL(document.location)).searchParams;
	let rout = [homePage, `${API}/posts`];
	if (query.has("postId")) rout = [detailPage, `${API}/posts/${+query.get("postId")}`];
	if (query.has("userId")) rout = [userPage, `${API}/users/${+query.get("userId")}`];
	getDataAndRender(...rout);
}

function getDataAndRender(component, apiEndpoint) {
	return getData(apiEndpoint)
		.then(r => render(component, r))
		.catch(err => render(errorPage, err));
}

async function getData(apiEndpoint) {
	const r = await fetch(apiEndpoint);
	if (r.status === 404) throw "not found";
	return await r.json();
}

function render(component, data) {
	document.getElementById("app").innerHTML = component(data);
}
