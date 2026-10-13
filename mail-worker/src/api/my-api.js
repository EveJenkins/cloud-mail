import totpService from '../service/totp-service';
import app from '../hono/hono';
import userService from '../service/user-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.get('/my/loginUserInfo', async (c) => {
	const user = await userService.loginUserInfo(c, userContext.getUserId(c), c.req.query('selectedAccountId'));
	return c.json(result.ok(user));
});

app.put('/my/resetPassword', async (c) => {
	await userService.resetPassword(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/my/delete', async (c) => {
	await userService.delete(c, userContext.getUserId(c));
	return c.json(result.ok());
});


app.get('/my/totp', async c => c.json(result.ok({enabled:!!(await totpService.row(c,userContext.getUserId(c)))?.enabled})));
app.post('/my/totp/setup', async c => c.json(result.ok(await totpService.setup(c,userContext.getUser(c)))));
app.post('/my/totp/enable', async c => {
 await totpService.verify(c,userContext.getUserId(c),(await c.req.json()).code,true);
 return c.json(result.ok());
});
app.post('/my/totp/disable', async c => {
 const id = userContext.getUserId(c);
 await totpService.verify(c,id,(await c.req.json()).code);
 await c.env.db.prepare('DELETE FROM user_totp WHERE user_id=?').bind(id).run();
 return c.json(result.ok());
});
