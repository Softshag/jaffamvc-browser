describe('Channel', function() {

	describe('Commands', function() {

		var obj = null,
			handler = null;

		beforeEach(function() {
			obj = Object.create(JaffaMVC.Channel.Commands);
			handler = jasmine.createSpy('commands');
			obj.comply('test:event', handler);

		});

		it('should add a command', function() {

			expect(obj._cmds).not.toBe(null);
			expect(obj._cmds['test:event']).toBeDefined();

			var c = obj._cmds['test:event'];
			expect(c.fn).toEqual(handler);

			expect(c.ctx).toEqual(obj);

		});

		it('should comply to a command', function() {

			obj.command('test:event', 'hello', 'world');
			expect(handler).toHaveBeenCalledWith('hello', 'world');

		});

		it('should remove a command', function() {

			obj.stopComplying('test:event', handler);
			expect(Object.keys(obj._cmds).length).toBe(0);

		});

	});

	describe('Request', function() {

		var obj = null,
			handler = null;

		beforeEach(function() {
			obj = Object.create(JaffaMVC.Channel.Requests);
      handler = function (arg) {
        return "Hello, " + arg
      }
			obj.reply('test:event', handler);

		});

		it('should add a request', function() {

			expect(obj._reqs).not.toBe(null);
			expect(obj._reqs['test:event']).toBeDefined();

			var c = obj._reqs['test:event'];
			expect(c.fn).toEqual(handler);
			expect(c.ctx).toEqual(obj);

		});

		it('should reply to a request', function(done) {

			var ret = obj.request('test:event', 'World');
			expect(ret).toEqual(jasmine.any(Promise));
			ret.then(function (str) {
				expect(str).toBe("Hello, World");
				done();
			}, done)

		});

		it('should remove a request', function() {

			obj.stopReplying('test:event', handler);
			expect(Object.keys(obj._reqs).length).toBe(0);

		});

	});

});
