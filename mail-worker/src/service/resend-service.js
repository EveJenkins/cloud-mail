import emailService from './email-service';
import { emailConst } from '../const/entity-const';
import BizError from '../error/biz-error';

const resendService = {

	async webhooks(c, body) {
		if (!body?.data?.email_id) return
		const params = {resendEmailId: body.data.email_id, status: null, message: null}

		if (body.type === 'email.delivered') {
			params.status = emailConst.status.DELIVERED
			params.message = null
		}

		if (body.type === 'email.complained') {
			params.status = emailConst.status.COMPLAINED
			params.message = null
		}

		if (body.type === 'email.bounced') {
			params.status = emailConst.status.BOUNCED
			params.message = JSON.stringify({message: body.data.bounce?.message || body.data.bounce?.reason || 'Resend reported a bounced message'})
		}

		if (body.type === 'email.delivery_delayed') {
			params.status = emailConst.status.DELAYED
			params.message = null
		}

		if (body.type === 'email.failed') {
			params.status = emailConst.status.FAILED
			params.message = JSON.stringify({message: body.data.failed?.reason || 'Resend reported a failed message'})
		}
		if (params.status === null) return

		const emailRow = await emailService.updateEmailStatus(c, params)

		if (!emailRow) {
			const existing = await c.env.db.prepare('SELECT email_id FROM email WHERE resend_email_id = ? LIMIT 1')
				.bind(params.resendEmailId).first()
			if (!existing) throw new BizError('更新邮件状态记录失败');
		}

	}
}

export default resendService
