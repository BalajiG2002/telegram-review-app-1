const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Review {
    id: ID!
    text: String!
    sentimentScore: Float!
    userId: User!
  }

  type User {
    id: ID!
    username: String!
  }

  type Query {
    reviews: [Review!]!
  }
  input ReviewInput {
    productId: ID!
    rating: Int!
    comment: String
  }
  
  # Define the Query and Mutation types
  type Query {
    reviews(productId: ID): [Review!]! # Get reviews for a product
    # Add other queries as needed
  }
  
  type Mutation {
    submitReview(reviewInput: ReviewInput!): Review!
  }
  type Mutation {
    addReview(text: String!, sentimentScore: Float!): Review!
    register(username: String!, password: String!): User!
    login(username: String!, password: String!): AuthPayload!
    submitReview(reviewInput: ReviewInput!): Review!
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;

module.exports = typeDefs;
