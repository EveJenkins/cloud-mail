import app from '../hono/hono';
import emailService from '../service/email-service';
import result from '../model/result';
import userContext from '../security/user-context';
import attService from '../service/att-service';
import aiService from '../service/ai-service';
import BizError from '../error/biz-error';

app.get('/email/list', async (c) => {
	const data = await emailService.list(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.get('/email/latest', async (c) => {
	const list = await emailService.latest(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(list));
});

app.delete('/email/delete', async (c) => {
	await emailService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/email/attList', async (c) => {
	const attList = await attService.list(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(attList));
});

app.post('/email/send', async (c) => {
	const email = await emailService.send(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(email));
});

app.post('/email/aiReply', async (c) => {
	const body = await c.req.json();
	const emailId = Number(body.emailId);
	const currentUserId = userContext.getUserId(c);
	const email = emailId ? await emailService.selectById(c, emailId) : null;
	if (!email || email.userId !== currentUserId) {
		throw new BizError('邮件不存在或无权访问', 404);
	}
	const data = await aiService.draftReply(c, email, {
		tone: body.tone,
		language: body.language,
		variant: Boolean(body.variant)
	});
	return c.json(result.ok(data));
});

app.post('/email/aiCompose', async (c) => {
	const body = await c.req.json();
	const data = await aiService.transformCompose(c, body.content, {
		task: body.task,
		language: body.language
	});
	return c.json(result.ok(data));
});

app.put('/email/read', async (c) => {
	await emailService.read(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
})

