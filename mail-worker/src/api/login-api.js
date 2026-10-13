import totpService from '../service/totp-service';
import userService from '../service/user-service';
import app from '../hono/hono';
import loginService from '../service/login-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.post('/login', async (c) => {
	const token = await loginService.login(c, await c.req.json());
	return c.json(result.ok({ token: token }));
});

app.post('/register', async (c) => {
	const jwt = await loginService.register(c, await c.req.json());
	return c.json(result.ok(jwt));
});

app.delete('/logout', async (c) => {
	await loginService.logout(c, userContext.getUserId(c));
	return c.json(result.ok());
});


app.post('/login/totp', async c => {
 const {challenge, code} = await c.req.json();
 const id = await totpService.consume(c,challenge,code);
 const user = await userService.selectById(c,id);
 if (!user) throw new Error('User unavailable');
 const token = await loginService.login(c,{email:user.email},true,id);
 return c.json(result.ok({token}));
});
