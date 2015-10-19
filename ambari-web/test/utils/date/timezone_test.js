/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var timezoneUtils = require('utils/date/timezone');

describe('timezoneUtils', function () {

  describe('#_groupTimezones', function () {

    var formattedTimezones = [
      {utcOffset: 1, groupByKey: 1, formattedOffset: '+01:00', value: 'a/Aa', region: 'a', city: 'Aa'},
      {utcOffset: 1, groupByKey: 1, formattedOffset: '+01:00', value: 'a/Bb', region: 'a', city: 'Bb'},
      {utcOffset: 2, groupByKey: 2, formattedOffset: '+02:00', value: 'a/Cc', region: 'a', city: 'Cc'},
      {utcOffset: 2, groupByKey: 2, formattedOffset: '+02:00', value: 'a/Dd', region: 'a', city: 'Dd'},
      {utcOffset: 1, groupByKey: 1, formattedOffset: '+01:00', value: 'b/Ee', region: 'b', city: 'Ee'},
      {utcOffset: 1, groupByKey: 1, formattedOffset: '+01:00', value: 'b/Ff', region: 'b', city: 'Ff'},
      {utcOffset: 2, groupByKey: 2, formattedOffset: '+02:00', value: 'b/Gg', region: 'b', city: 'Gg'},
      {utcOffset: 2, groupByKey: 2, formattedOffset: '+02:00', value: 'b/Hh', region: 'b', city: 'Hh'},
      {utcOffset: 2, groupByKey: 2, formattedOffset: '+02:00', value: 'b/II', region: 'b', city: 'II'},
      {utcOffset: 2, groupByKey: 2, formattedOffset: '+02:00', value: 'b', region: 'b', city: ''}
    ];

    before(function () {
      this.result = timezoneUtils._groupTimezones(formattedTimezones);
    });

    it('should group to 4 groups', function () {
      expect(this.result.length).to.equal(4);
    });

    it('UTCOffset should be [1,1,2,2]', function () {
      expect(this.result.mapProperty('utcOffset')).to.eql([1, 1, 2, 2]);
    });

    it('should map regions and cities correctly', function () {
      var expected = ['(UTC+01:00) a / Aa, Bb',
      '(UTC+01:00) b / Ee, Ff',
      '(UTC+02:00) a / Cc, Dd',
      '(UTC+02:00) b / Gg, Hh'];
      var values = this.result.mapProperty('value');
      expect(values).to.eql(expected);
      expect(values.join('')).to.not.contain('II');
      expect(values.join('')).to.not.contain(', ,');
    });

  });

  describe('#_parseTimezones', function () {

    beforeEach(function () {
      sinon.stub(timezoneUtils, 'getAllTimezoneNames').returns([
        'Europe/Helsinki',
        'Asia/Magadan',
        'America/Lima'
      ]);
      sinon.stub(timezoneUtils, '_groupTimezones', function (list) {
        return list;
      });
      this.result = timezoneUtils._parseTimezones();
    });

    afterEach(function () {
      timezoneUtils.getAllTimezoneNames.restore();
      timezoneUtils._groupTimezones.restore();
    });

    it('should sort by offset and name', function () {
      expect(this.result.mapProperty('value')).to.eql(['America/Lima', 'Europe/Helsinki', 'Asia/Magadan']);
    });

    it('should split regions and cities', function () {
      expect(this.result.mapProperty('region')).to.eql(['America', 'Europe', 'Asia']);
      expect(this.result.mapProperty('city')).to.eql(['Lima', 'Helsinki', 'Magadan']);
    });

  });

  describe('#getAllTimezoneNames', function () {

    before(function () {
      this.result = timezoneUtils.getAllTimezoneNames();
    });

    after(function () {
      this.result = undefined;
    });

    it('timezone names are parsed', function () {
      expect(this.result).to.have.length.above(0);
    });

    it('Etc/* are excluded', function () {
      this.result.forEach(function (tz) {
        expect(tz.indexOf('Etc/')).to.equal(-1);
      });
    });

    it('Abbreviations are excluded', function () {
      this.result.forEach(function (tz) {
        expect(tz).to.not.equal(tz.toUpperCase());
      });
    });

  });

  describe('#detectUserTimezone', function () {

    var getTimezoneOffset = Date.prototype.getTimezoneOffset;

    function mockTimezoneOffset(jan, jul) {
      Date.prototype.getTimezoneOffset = function () {
        var month = this.getMonth();
        if (month > 3 && month < 9) {
          return -jul;
        }
        return -jan;
      };
    }

    afterEach(function () {
      Date.prototype.getTimezoneOffset = getTimezoneOffset;
    });

    it('Detect UTC+1', function () {
      mockTimezoneOffset(0, 60);
      var tz = timezoneUtils.detectUserTimezone();
      expect(tz).to.contain('(UTC+01:00) Atlantic');
    });

    it('Detect UTC+1 for Europe', function () {
      mockTimezoneOffset(0, 60);
      var tz = timezoneUtils.detectUserTimezone('Europe');
      expect(tz).to.contain('(UTC+01:00) Europe');
      expect(tz).to.contain('London');
    });

    it('Detect UTC-4', function () {
      mockTimezoneOffset(-300, -240);
      var tz = timezoneUtils.detectUserTimezone();
      expect(tz).to.contain('(UTC-04:00) America');
      expect(tz).to.contain('New York');
    });

    it('Detect UTC+3 for Asia', function () {
      mockTimezoneOffset(120, 180);
      var tz = timezoneUtils.detectUserTimezone();
      expect(tz).to.contain('(UTC+03:00) Asia');
      expect(tz).to.contain('Damascus');
    });

    it('Detect UTC-7', function () {
      mockTimezoneOffset(-480, -420);
      var tz = timezoneUtils.detectUserTimezone();
      expect(tz).to.contain('(UTC-07:00) America');
      expect(tz).to.contain('Los Angeles');
    });

  });

});