var assert = require('assert');
var diff = require('./');

describe('query()', function () {
  it('should $set modified keys', function () {
    var query = diff({ a: 1 }, { a: 2 });
    assert(query.$set.a == 2);
    assert(!('$unset' in query));
  });
  
  it('should $unset null-ish keys', function () {
    var query = diff({ a: 1 }, { a: null });
    assert(query.$unset.a == 1);
    assert(!('$set' in query));
  });
  
  it('should not $unset missing keys', function () {
    var query = diff({ a: 1 }, {});
    assert(query.$unset.a=1);
    assert(!('$set' in query));
  });
  
  it('should work with nested keys', function () {
    var query = diff({ a: { b: 1, c: 2 }}, { a: { b: 2, c: null }});
    assert(query.$set['a.b'] == 2);
    assert(query.$unset['a.c'] == 1);
  });
  
  describe('when given a filter', function () {
    it('should minify the query', function () {
      var query = diff({ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 1 });
      assert(query.$set.a == 2);
      assert(!('b' in query.$set));
    });
    
    it('should work with nested keys', function () {
      var query = diff({ a: { b: 1, c: 2 }}, { a: { b: 2, c: null }}, { 'a.b': 1 });
      assert(query.$set['a.b'] == 2);
      assert(!('$unset' in query));
    });
  });
  
  describe('when given a prefix', function () {
    it('should prefix all keys', function () {
      var query = diff({ a: 1, b: 2 }, { a: 2, b: 3 }, 'prefix.$');
      assert(query.$set['prefix.$.a'] == 2);
      assert(query.$set['prefix.$.b'] == 3);
    });
    
    it('should work with a filter', function () {
      var query = diff({ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 1 }, 'prefix.$');
      assert(query.$set['prefix.$.a'] == 2);
      assert(!('prefix.$.b' in query.$set));
    });
  })
  
  describe('when given a prefix and a filter', function () {
    it('should prefix all keys in the filter', function () {
      var query = diff({ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 1 }, 'prefix.$');
      assert(query.$set['prefix.$.a'] == 2);
      assert(!('prefix.$.b' in query.$set));
    });
    
    it('should accept them in any order', function () {
      var query = diff({ a: 1, b: 2 }, { a: 2, b: 3 }, 'prefix.$', { a: 1 });
      assert(query.$set['prefix.$.a'] == 2);
      assert(!('prefix.$.b' in query.$set));
    });
  })
})

describe('typeQuery()', function () {
  it('should work with empty object', function () {
    var query = diff({}, {});
    assert(!('$set' in query));
    assert(!('$unset' in query));

    query = diff(null, {});
    assert(!('$set' in query));
    assert(!('$unset' in query));

    query = diff(null,null);
    assert(!('$set' in query));
    assert(!('$unset' in query));

    query = diff(undefined,null);
    assert(!('$set' in query));
    assert(!('$unset' in query));

    query = diff(undefined,{a:34});
    assert(query.$set.a==34);
    assert(!('$unset' in query));

    query = diff(undefined,undefined);
    assert(!('$set' in query));
    assert(!('$unset' in query));

    query = diff({a:{b:"001"}},undefined);
    assert(!('$set' in query));
    assert(query.$unset.a==1);

    query = diff({a:{b:"001"}},null);
    assert(!('$set' in query));
    assert(query.$unset.a==1);

  });

  it('should work with string', function () {
    var query = diff({ a:"abc"}, { a: "ab" });
    assert(query.$set.a == "ab");
    assert(!('$unset' in query));

    var query = diff({}, { a: "ab"});
    assert(query.$set.a == "ab");
    assert(!('$unset' in query));

    query = diff({ a:"abc"}, { a:null});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    query = diff({ a:"abc"}, { a:undefined});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    query = diff({b:"ff",c:{name:23}}, { a:"abc"});
    assert(query.$set.a == "abc");
    assert(query.$unset.b == 1);
    assert(query.$unset.c == 1);

    query = diff({b:"ff",c:{name:23,sex:true}}, { a:"abc",c:{name:33,sex:false}});
    assert(query.$set.a == "abc");
    assert(query.$set['c.sex'] == false);
    assert(query.$set['c.name'] ==33);
    assert(query.$unset.b == 1);
  });

  it('should work with int', function () {
    var query = diff({ a:0}, { a:8});
    assert(query.$set.a == 8);
    assert(!('$unset' in query));

    var query = diff({}, { a: 9});
    assert(query.$set.a == 9);
    assert(!('$unset' in query));

    query = diff({ a:99}, { a:null});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    query = diff({ a:99}, { a:undefined});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    query = diff({b:99,c:{name:23}}, { a:88});
    assert(query.$set.a == 88);
    assert(query.$unset.b == 1);
    assert(query.$unset.c == 1);

    query = diff({b:9909999,c:{name:23,sex:true}}, { a:"abc",c:{name:33,sex:false}});
    assert(query.$set.a == "abc");
    assert(query.$set['c.sex'] == false);
    assert(query.$set['c.name'] ==33);
    assert(query.$unset.b == 1);
  });

  it('should work with float', function () {
    var query = diff({ a:0.90988888}, { a:0.98888888});
    assert(query.$set.a == 0.98888888);
    assert(!('$unset' in query));

    var query = diff({}, { a: .00001});
    assert(query.$set.a == 0.00001);
    assert(!('$unset' in query));

    query = diff({ a:99.9999}, { a:null});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    query = diff({ a:99.999999}, { a:undefined});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    query = diff({b:99.9999,c:{name:23.99999}}, { a:88.999});
    assert(query.$set.a == 88.999);
    assert(query.$unset.b == 1);
    assert(query.$unset.c == 1);

    query = diff({b:9909999.777,c:{name:23.998712,sex:true}}, { a:"abc",c:{name:24.7655,sex:false}});
    assert(query.$set.a == "abc");
    assert(query.$set['c.sex'] == false);
    assert(query.$set['c.name'] ==24.7655);
    assert(query.$unset.b == 1);
  });

  it('should work with date', function () {
    var d1=new Date(),d2=new Date();
    var query = diff({ a:d1}, { a:d2});
    assert(query.$set.a-d2 == 0);
    assert(!('$unset' in query));

    d1=new Date();
    d2=new Date();
    var query = diff({}, { a:d1});
    assert(query.$set.a-d1==0);
    assert(!('$unset' in query));

    d1=new Date();
    d2=new Date();
    query = diff({ a:d1}, { a:null});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    d1=new Date();
    d2=new Date();
    query = diff({ a:d1}, { a:undefined});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    d1=new Date();
    d2=new Date();
    query = diff({b:d1,c:{name:d2}}, { a:d2});
    assert(query.$set.a-d2 == 0);
    assert(query.$unset.b == 1);
    assert(query.$unset.c == 1);

    d1=new Date();
    d2=new Date();
    query = diff({b:d1,c:{name:d2,sex:true}}, { a:d2,c:{name:d1,sex:false}});
    assert(query.$set.a-d2 == 0);
    assert(query.$set['c.sex'] == false);
    assert(query.$set['c.name']-d1 ==0);
    assert(query.$unset.b == 1);
  });

  function eqArray(a1,a2){
    a1=a1||[];
    a2=a2||[];
    if(a1.length!=a2.length){
        return false;
    }else{
        for(var i=0;i<a1.length;i++){
            if(a1[i]!=a2[i]) return false;
        }
    }
    return true;
  }

  it('should work with array', function () {
    var d1=[],d2=[1,2,3];
    var query = diff({ a:d1}, { a:d2});
    assert(eqArray(query.$set.a,d2));
    assert(!('$unset' in query));

    d1=[2,3];
    d2=[]
    var query = diff({}, { a:d1});
    assert(eqArray(query.$set.a,d1));
    assert(!('$unset' in query));

    d1=[2,3];
    d2=[]
    query = diff({ a:d1}, { a:null});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    d1=[2,3];
    d2=[]
    query = diff({ a:d1}, { a:undefined});
    assert(!('$set' in query));
    assert(query.$unset.a == 1);

    d1=[2,3,88,true];
    d2=[8,9,110,false]
    query = diff({b:d1,c:{name:d2}}, { a:d2});
    assert(eqArray(query.$set.a,d2));
    assert(query.$unset.b == 1);
    assert(query.$unset.c == 1);

    d1=[2,3,88,true];
    d2=[8,9,110,false]
    query = diff({b:d1,c:{name:d2,sex:true}}, { a:d2,c:{name:d1,sex:false}});
    assert(eqArray(query.$set.a,d2));
    assert(query.$set['c.sex'] == false);
    assert(eqArray(query.$set['c.name'],d1));
    assert(query.$unset.b == 1);
  });

  it('should work with deep object', function () {
    var query = diff({a9:88,a:{d:34,c:{name:"ff",d:{age:34,palce:{data:[1,3,4,false]}}}}}, {a:{d:88,c:{name:"ff",d:{age:88,palce:{data:[33,8]}}}},b:{name:"ff",data:{time:new Date(),age:34,child:[{name:"jj"}]}}});
    assert(query.$unset.a9 == 1);
    assert(query.$set['a.d'] == 88);
    assert(query.$set['a.c.d.age'] == 88);
    assert(eqArray(query.$set['a.c.d.palce.data'],[33,8]));
  });



});
 
