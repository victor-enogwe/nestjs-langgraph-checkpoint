// Sequelize Association Demo - https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbwLACg5wLIQCYFMA2ANKujAJ5i5wCSAdgGa5QCCMMUwARgK4y4DOxNHHKUaDJgGEouAIYxgEWq3ZdeAoaQpUAQgSUBzfgBUIAcVwxm-fhADGweYtoZgAD2C1NI7XD35DEwgAZUtrWwcnJVcPLxIfMX9A02k5PnD7RwVo909vUSoACVl+DFlaMgsrG0yo2lLcuOECuGLS8rJJCG5aaois5wbY-N82soq2jMjs+pi8+JaxjtC+2pmh+ebRkvGyZmxsKYGlDaatMSWKgCVcEAgAN1wjutORi52OyZrp5zmzhKKHwq+0O32OLkab0B7WutweTzBdT+UNaQM6MnkCP6SMhqAAvnB6FAICA4AAifi4ACO3AIwAAXrgyQBuVCoAD07LgeHonioAAsCJQoAD+KgWgAFCD8GC8twS4nChQCAA8CogYGM2kEcClMrlcFwbj4tGw-DgMo4tAMAD44ABeRDxADaErgnjgAGtcGQIPRdYqtZRzSU4AADAAkCAAom47PhuHg1YQLWQQJwIPgbXio3rZe48WGALoALgDGqDAldRdZKDxtfFvgVlgU9DIKuMdsdCDgrvdtC9Pr9cGMpZH1bg9bZKE5cBK2JmcBAjX7fCg9FkdgEjcS+mtQT+Kvizz42CweHwhuNuFN5vPBG8CtAsigZAA0j7K94AHKyEBUI0TTNC1VGtIQu11aV83lRUmGVfgj2EZBhHQAxLDLJJ91MKoT1+RoVRPXAzxwAgbVrdB0EpGAML3IxTBWXCcliAjEVPe8iADZ9Xw-MhKzI+J0DsDE+BogIsIgVJMUYiFmMI4iL344Q8W8SRZDAYAYFkfAGVwFVf3-G1UEUndoV2Q9j1Yoj2KvIC7xIoh4ifEAX3fT9tG8YJPAMbh8BffSAOvW8QKtAxHwTKAtP8myb2Ay0vPAh0AxbYA20Q9A8zldUlWAVUBKdFCKLQ6jURhSowlYwZDzk9jFIoii7G6Xoy0uTpGtWH4Tj+ci6rgfkSmatEvgXSr8Oq+yUyclyeL47q6qogbSoYirOtGyz5IfTjnO4tzKFqnrZAOBbdhBaTThYhcrPGzapp23A9rqmQ7keI6OhuJ6sTWEbZLW9iJo4LbXN47R7snbx0FU9TNO0xk1XCyK-zu+I7QAMjyjL3CyuCcoQvL0GQnqKL6-gXomEppKqn6rsm7agd22b9sOkrjoOcnVou9aOOpwGZtxijHvhEmyDe+FWe+9nfuummeYKuqhLSXBBck9JlpkzxzrWS6FPp9BlN5iGNK0nSVU860fL8hHDIKy3jJnLkeT5Jd7LFFBPDXDctzgAAxCAIGioLMLoiBDx0F8U1obh0yYFMyRDqAyTtBA8VQeN5y9n2-eA9iVToRgWDYDgeD4BDvYgG0UxzqRhOcFQC-UYufZtBP4jwFOZHdbAy3DyOoG62cADoB-xacU5sPwXwzuyL2ziQ89UQvVVjsvxFzpXq-ztQi5VRem+EFvfLb4AO7gLvOCYXuuQHvuh5QDk7dwXlaCoedPqUAAKfgAEpUBLvvT7EwPX6xw-g2W2cA5aYn7DKcoW5k4nHgPQdOjof48GAPgbAr8eyHzLAAFgAEyTmAdOWc3BKQAmwEuRoABCVACCIB93AXwWOGD25lgABysIIbWIAA
import type {
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManyRemoveAssociationsMixin,
  HasManySetAssociationsMixin,
  Model
} from 'sequelize';

// define helper types
type PostfixProperties<PropTypes, Postfix extends string> = {
  [P in keyof PropTypes as `${Exclude<P, symbol>}${Postfix}`]: PropTypes[P];
};

type Prettify<T> = { [P in keyof T]: T[P] };

// association mixin interfaces
export type BelongsToMixin<
  AssociatedModel extends Model,
  PrimaryKeyType,
  Name extends string,
> = PostfixProperties<
  {
    get: BelongsToGetAssociationMixin<AssociatedModel>;
    set: BelongsToSetAssociationMixin<AssociatedModel, PrimaryKeyType>;
    create: BelongsToCreateAssociationMixin<AssociatedModel>;
  },
  Capitalize<Name>
>;

export type HasManyMixin<
  AssociatedModel extends Model,
  PrimaryKeyType,
  SingularName extends string,
  PluralName extends string,
> = Prettify<
  PostfixProperties<
    {
      get: HasManyGetAssociationsMixin<AssociatedModel>;
      count: HasManyCountAssociationsMixin;
      has: HasManyHasAssociationsMixin<AssociatedModel, PrimaryKeyType>;
      set: HasManySetAssociationsMixin<AssociatedModel, PrimaryKeyType>;
      add: HasManyAddAssociationsMixin<AssociatedModel, PrimaryKeyType>;
      remove: HasManyRemoveAssociationsMixin<AssociatedModel, PrimaryKeyType>;
    },
    Capitalize<PluralName>
  > &
    PostfixProperties<
      {
        has: HasManyHasAssociationMixin<AssociatedModel, PrimaryKeyType>;
        add: HasManyAddAssociationMixin<AssociatedModel, PrimaryKeyType>;
        remove: HasManyRemoveAssociationMixin<AssociatedModel, PrimaryKeyType>;
        create: HasManyCreateAssociationMixin<AssociatedModel>;
      },
      Capitalize<SingularName>
    >
>;
