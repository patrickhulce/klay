var jpegMetadata = {type: 'jpeg', };

module.exports = {
  users: [
    {age: 62, isAdmin: true, email: 'john.doe@example.com', password: 'password1', firstName: 'John', lastName: 'Doe'},
    {age: 54, isAdmin: true, email: 'jane.doe@example.com', password: 'password', firstName: 'Jane', lastName: 'Doe'},
    {age: 27, isAdmin: false, email: 'jack.doe@example.com', password: 'pwd1', firstName: 'Jack', lastName: 'Doe'},
    {age: 21, isAdmin: false, email: 'jill.doe@example.com', password: 'pwd2', firstName: 'Jill', lastName: 'Doe'},
    {age: 18, isAdmin: false, email: 'jay.doe@example.com', password: 'pwd3', firstName: 'Jay', lastName: 'Doe'},
    {age: 24, isAdmin: false, email: 'smith@example.com', password: 'ps', firstName: 'Phil', lastName: 'Smith'},
  ],
  photos: [
    {ownerId: 'a', aspectRatio: 2.0, metadata: {type: 'jpeg', width: 200, height: 100}},
    {ownerId: 'a', aspectRatio: 1, metadata: {type: 'png', width: 100, height: 100}},
    {ownerId: 'a', aspectRatio: 0.66, metadata: {type: 'psd', width: 200, height: 300}},
    {ownerId: 'b', aspectRatio: 2.0, metadata: {type: 'gif', width: 200, height: 100}},
    {ownerId: 'b', aspectRatio: 1, metadata: {type: 'jpeg', width: 1000, height: 1000}},
    {ownerId: 'c', aspectRatio: 3, metadata: {type: 'jpeg', width: 3000, height: 1000}},
    {ownerId: 'd', aspectRatio: 2, metadata: {type: 'png', width: 150, height: 75}},
  ],
};
